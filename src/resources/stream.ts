import { anySignal, sleep, type RequestOptions } from '../core.js';
import { ApiError, CursorExpiredError, PermissionDeniedError, errorFromResponse, parseRetryAfter } from '../errors.js';
import { iterateBody, parseSse } from '../sse.js';
import type { EndorsementEvent, EventsPage, ListEventsParams, StreamParams } from '../types.js';
import { ConnectionError, TimeoutError } from '../errors.js';
import { Resource } from './resource.js';

/** What a live stream yields. */
export type StreamMessage =
  | {
      /** The connection is open. Sent first on every connection, including reconnects. */
      type: 'ready';
      /** The subscription's name, or `"inline"` for filter parameters. */
      subscription: string | null;
      /** The position the connection started at. */
      cursor: string | undefined;
    }
  | {
      /** An endorsement was created, updated or deleted. */
      type: 'endorsement';
      event: EndorsementEvent;
      /** The position just after this event. Save it to resume here. */
      cursor: string;
    };

/** Options for {@link StreamResource.connect}. */
export interface StreamOptions {
  /** Abort the stream. Iteration then throws the signal's reason. To stop quietly, call `stream.close()`. */
  signal?: AbortSignal;
  /**
   * Called whenever the position moves: after each event, and on checkpoints
   * that skip changes your filter doesn't match. Save the cursor somewhere
   * durable and pass it back as `cursor` to resume exactly here.
   */
  onCursor?: (cursor: string) => void;
  /**
   * Reconnect after the hourly `reconnect`, a dropped connection, a silent
   * connection, or a 429/503 (after Retry-After). Default true. With false,
   * iteration ends when the connection does.
   */
  reconnect?: boolean;
  /**
   * Milliseconds of silence after which a connection is treated as dead and
   * reopened. The API writes at least every 20 seconds. Default 60 000.
   */
  idleTimeout?: number;
  /** Longest wait between reconnect attempts, in milliseconds. Default 60 000. */
  maxReconnectDelay?: number;
  /** Called before each reconnect, with why and how long it will wait. */
  onReconnect?: (info: { attempt: number; delayMs: number; reason: 'reconnect' | 'dropped' | 'idle' | 'busy' | 'unreachable'; error?: unknown }) => void;
}

/** Options for {@link EventsResource.follow}. */
export interface FollowOptions extends Omit<RequestOptions, 'timeout'> {
  /** Called with the new cursor after each page. Save it to resume. */
  onCursor?: (cursor: string) => void;
}

/**
 * A live connection to `GET /v1/stream`. Iterate it with `for await`.
 *
 * ```ts
 * const stream = client.stream.connect({ states: 'CA' }, { onCursor: save });
 * for await (const message of stream) {
 *   if (message.type === 'endorsement') handle(message.event);
 * }
 * ```
 */
export class EndorsementStream implements AsyncIterable<StreamMessage> {
  /** The latest position. Undefined until the first `ready` when no cursor was given. */
  cursor: string | undefined;
  /** The subscription's name (or `"inline"`), once connected. */
  subscription: string | null = null;

  readonly #resource: StreamResource;
  readonly #params: Omit<StreamParams, 'cursor'>;
  readonly #options: StreamOptions;
  readonly #closer = new AbortController();
  #started = false;

  /** @internal */
  constructor(resource: StreamResource, params: StreamParams, options: StreamOptions) {
    const { cursor, ...rest } = params;
    this.#resource = resource;
    this.#params = rest;
    this.#options = options;
    this.cursor = cursor;
  }

  /** Stop the stream. A `for await` loop over it ends normally. */
  close(): void {
    this.#closer.abort();
  }

  /** Whether {@link close} was called. */
  get closed(): boolean {
    return this.#closer.signal.aborted;
  }

  [Symbol.asyncIterator](): AsyncGenerator<StreamMessage, void, undefined> {
    if (this.#started) throw new Error('A stream can be iterated once. Call client.stream.connect() again.');
    this.#started = true;
    return this.#run();
  }

  #moveTo(cursor: string): void {
    if (cursor === this.cursor) return;
    this.cursor = cursor;
    this.#options.onCursor?.(cursor);
  }

  async *#run(): AsyncGenerator<StreamMessage, void, undefined> {
    const transport = this.#resource.transportFor();
    const { signal: userSignal, reconnect = true, idleTimeout = 60_000, maxReconnectDelay = 60_000, onReconnect } = this.#options;
    const stop = anySignal([userSignal, this.#closer.signal]);
    let retryMs = 5000; // the API sends "retry: 5000"; we follow what it says
    let failures = 0;

    const wait = async (reason: Parameters<NonNullable<StreamOptions['onReconnect']>>[0]['reason'], delayMs: number, error?: unknown) => {
      onReconnect?.({ attempt: failures, delayMs, reason, error });
      await sleep(delayMs, stop);
    };
    const backoff = () => Math.min(maxReconnectDelay, retryMs * 2 ** Math.min(Math.max(failures - 1, 0), 4)) * (0.8 + Math.random() * 0.4);

    try {
      while (!stop.aborted) {
        const connection = new AbortController();
        const signal = anySignal([stop, connection.signal]);
        const url = transport.url('/v1/stream', { ...this.#params });
        const headers: Record<string, string> = { ...transport.baseHeaders(), Accept: 'text/event-stream' };
        if (this.cursor) headers['Last-Event-ID'] = this.cursor;

        let res: Response;
        try {
          const sent = await transport.send(url, { method: 'GET', headers, signal }, transport.timeout);
          sent.release(); // the timeout covers connecting; idleTimeout covers the open stream
          res = sent.res;
        } catch (err) {
          if (stop.aborted) break;
          if (!reconnect || !(err instanceof ConnectionError || err instanceof TimeoutError)) throw err;
          failures++;
          await wait('unreachable', backoff(), err);
          continue;
        }
        transport.observe('GET', url, res);

        if (!res.ok) {
          const error = await errorFromResponse(res);
          // Busy, warming up, or too many open streams: wait as told, then try again.
          if (reconnect && (res.status === 429 || res.status === 503)) {
            failures++;
            const after = parseRetryAfter(res.headers.get('retry-after'));
            await wait('busy', after !== null ? after * 1000 : backoff(), error);
            continue;
          }
          throw error;
        }

        let reason: 'reconnect' | 'dropped' | 'idle' = 'dropped';
        let idle = false;
        let timer = setTimeout(onIdle, idleTimeout);
        function onIdle() {
          idle = true;
          connection.abort();
        }
        const chunks = async function* (body: ReadableStream<Uint8Array>) {
          for await (const chunk of iterateBody(body)) {
            clearTimeout(timer);
            timer = setTimeout(onIdle, idleTimeout);
            yield chunk;
          }
        };

        try {
          if (!res.body) throw new ConnectionError('The stream response had no body.');
          for await (const message of parseSse(chunks(res.body))) {
            if (message.retry) retryMs = message.retry;
            if (message.id) this.#moveTo(message.id);
            switch (message.event) {
              case 'ready': {
                failures = 0;
                this.subscription = (JSON.parse(message.data) as { subscription?: string }).subscription ?? null;
                yield { type: 'ready', subscription: this.subscription, cursor: this.cursor };
                break;
              }
              case 'endorsement':
                yield { type: 'endorsement', event: JSON.parse(message.data) as EndorsementEvent, cursor: this.cursor! };
                break;
              case 'reconnect':
                // The API ends connections after an hour so load spreads out. Not an error.
                reason = 'reconnect';
                break;
              case 'error': {
                const { code } = JSON.parse(message.data) as { code?: string };
                throw streamError(code ?? 'stream_error', res.headers);
              }
              // 'checkpoint' only moves the cursor (above): past changes your filter skipped.
            }
          }
        } catch (err) {
          if (err instanceof ApiError || stop.aborted) throw err;
          if (!idle && !(err instanceof ConnectionError) && !isNetworkError(err)) throw err;
          // Dropped mid-stream, or silent too long: reconnect below.
        } finally {
          clearTimeout(timer);
          connection.abort();
        }

        if (idle) reason = 'idle';
        if (stop.aborted || !reconnect) break;
        if (reason === 'reconnect') {
          onReconnect?.({ attempt: 0, delayMs: 0, reason });
        } else {
          failures++;
          await wait(reason, backoff());
        }
      }
    } catch (err) {
      // close() ends iteration quietly; an aborted user signal throws its reason.
      if (this.#closer.signal.aborted && !userSignal?.aborted) return;
      throw err;
    }
    if (userSignal?.aborted && !this.#closer.signal.aborted) throw userSignal.reason;
  }
}

function streamError(code: string, headers: Headers): ApiError {
  if (code === 'cursor_expired') {
    return new CursorExpiredError(
      410,
      code,
      'That position is older than the stream keeps. Catch up with client.endorsements.list(), then start again with from: "latest".',
      null,
      headers,
    );
  }
  if (code === 'no_access') {
    return new PermissionDeniedError(403, code, 'Your account no longer has stream access: its purchase ended or was refunded.', null, headers);
  }
  return new ApiError(500, code, 'The stream ended with an error.', null, headers);
}

/** Errors fetch body readers throw when a connection drops (they differ by runtime). */
function isNetworkError(err: unknown): boolean {
  const name = (err as Error)?.name;
  return name === 'AbortError' || name === 'TypeError' || name === 'TimeoutError' || (err as { code?: string })?.code === 'ECONNRESET';
}

/**
 * `GET /v1/stream`: every endorsement change matching a subscription or
 * filter, as Server-Sent Events, within seconds of it happening.
 *
 * Needs a key with the `stream:read` scope and a purchase that includes the
 * stream. Your plan sets how many streams you can hold open.
 */
export class StreamResource extends Resource {
  /** @internal */
  transportFor() {
    return this.transport;
  }

  /**
   * Open the live stream. Nothing is sent until you start iterating.
   *
   * The stream keeps its place: each event's `cursor` is a position, and the
   * stream reconnects with it (after the hourly `reconnect`, a dropped or
   * silent connection, or a 429/503) so nothing is missed or repeated. Save
   * the cursor in `onCursor` and pass it back as `cursor` after a restart.
   *
   * Iteration throws {@link CursorExpiredError} when the cursor is older than
   * the stream keeps (catch up with `client.endorsements.list()`, then start
   * with `from: 'latest'`), {@link PermissionDeniedError} when access ends, and
   * {@link AuthenticationError} for a bad key.
   *
   * @param params A `subscription` (id or name), or filter fields; and where to start: `cursor`, `since`, or `from` (`latest` by default).
   * @example
   * const stream = client.stream.connect(
   *   { states: ['CA', 'NV'], categories: 'labor', cursor: await load() },
   *   { onCursor: (cursor) => save(cursor) },
   * );
   * for await (const message of stream) {
   *   if (message.type === 'endorsement') console.log(message.event.type, message.event.choice.label);
   * }
   */
  connect(params: StreamParams = {}, options: StreamOptions = {}): EndorsementStream {
    return new EndorsementStream(this, params, options);
  }

  /**
   * The same as {@link connect}, yielding only the endorsement events.
   *
   * @example
   * for await (const { event, cursor } of client.stream.endorsements({ subscription: 'CA labor' })) {
   *   await handle(event);
   *   await save(cursor);
   * }
   */
  async *endorsements(params: StreamParams = {}, options: StreamOptions = {}): AsyncGenerator<{ event: EndorsementEvent; cursor: string }, void, undefined> {
    for await (const message of this.connect(params, options)) {
      if (message.type === 'endorsement') yield { event: message.event, cursor: message.cursor };
    }
  }
}

/**
 * `GET /v1/events`: the same changes as the stream, a page at a time. For
 * places that can't hold a connection open: serverless functions, cron jobs,
 * some proxies.
 */
export class EventsResource extends Resource {
  /**
   * One page of changes after a cursor. Store `next_cursor` and send it next
   * time. With `wait` (up to 25 seconds) the request is held open until a
   * matching change arrives. `has_more` means call again right away.
   *
   * @throws {CursorExpiredError} when the cursor is older than the stream keeps.
   * @example
   * let cursor = await load();
   * do {
   *   const page = await client.events.list({ subscription: 'CA labor', cursor, limit: 1000 });
   *   for (const event of page.data) await handle(event);
   *   cursor = page.next_cursor;
   *   await save(cursor);
   *   if (!page.has_more) break;
   * } while (true);
   */
  async list(params: ListEventsParams = {}, options: RequestOptions = {}): Promise<EventsPage> {
    // A long poll needs longer than wait to answer.
    const timeout = Math.max(options.timeout ?? this.transport.timeout, ((params.wait ?? 0) + 15) * 1000);
    return this.transport.request<EventsPage>({ method: 'GET', path: '/v1/events', query: { ...params }, options: { ...options, timeout } });
  }

  /**
   * Long-poll forever, yielding each change as it arrives. Each request waits
   * up to `wait` seconds (default 20). Network trouble is retried; API errors
   * (such as {@link CursorExpiredError}) are thrown.
   *
   * @example
   * for await (const { event, cursor } of client.events.follow({ states: 'CA', cursor: await load() })) {
   *   await handle(event);
   *   await save(cursor);
   * }
   */
  async *follow(params: ListEventsParams = {}, options: FollowOptions = {}): AsyncGenerator<{ event: EndorsementEvent; cursor: string }, void, undefined> {
    const { onCursor, ...requestOptions } = options;
    let { cursor, from, since, ...filter } = params;
    const wait = params.wait ?? 20;
    let failures = 0;
    while (!options.signal?.aborted) {
      let page: EventsPage;
      try {
        page = await this.list({ ...filter, ...(cursor ? { cursor } : { from, since }), wait }, requestOptions);
        failures = 0;
      } catch (err) {
        if (options.signal?.aborted) throw options.signal.reason;
        if (!(err instanceof ConnectionError || err instanceof TimeoutError)) throw err;
        failures++;
        await sleep(Math.min(60_000, 1000 * 2 ** Math.min(failures, 6)), options.signal);
        continue;
      }
      for (const event of page.data) yield { event, cursor: page.next_cursor };
      if (page.next_cursor !== cursor) {
        cursor = page.next_cursor;
        onCursor?.(cursor);
      }
    }
    if (options.signal?.aborted) throw options.signal.reason;
  }
}
