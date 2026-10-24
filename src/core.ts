/**
 * The HTTP layer: authentication, query encoding, timeouts, retries, error
 * mapping, and paging. Resources build on {@link Transport.request}.
 *
 * @module
 */

import { ConnectionError, TimeoutError, errorFromResponse, parseRetryAfter, type ApiError } from './errors.js';
import type { RateLimit, ResponseInfo } from './types.js';
import { VERSION } from './version.js';

/** Options for {@link BallotData}. Every option is optional. */
export interface ClientOptions {
  /**
   * Your API key (`ebk_…`). Defaults to the `BALLOTDATA_API_KEY` environment
   * variable. Keys come with a purchase at https://ballotdata.net/pricing and
   * are created in the console at https://api.ballotdata.net/console/keys.
   * Keep keys on servers, never in a browser or mobile app.
   */
  apiKey?: string;
  /** API origin. Defaults to `BALLOTDATA_API_URL`, then `https://api.ballotdata.net`. */
  baseUrl?: string;
  /**
   * How many times to retry a request that failed in a way worth retrying:
   * 429 and 503 (after Retry-After), connection errors and timeouts, and 500,
   * 502 and 504 on GET, PUT and DELETE. Default 2. Set 0 to turn retries off.
   */
  maxRetries?: number;
  /** Milliseconds to wait for each response before giving up with {@link TimeoutError}. Default 30 000. */
  timeout?: number;
  /** A `fetch` to use instead of the global one (for a proxy agent, tests, or older runtimes). */
  fetch?: typeof fetch;
  /** Extra headers to send on every request. */
  headers?: Record<string, string>;
  /** Called after every HTTP response, including ones that are retried. Handy for logging and watching rate limits. */
  onResponse?: (info: ResponseInfo) => void;
}

/** Per-request options, accepted as the last argument of every method. */
export interface RequestOptions {
  /** Abort the request (and any retries) with this signal. */
  signal?: AbortSignal;
  /** Override the client's timeout for this request, in milliseconds. */
  timeout?: number;
  /** Override the client's maxRetries for this request. */
  maxRetries?: number;
  /** Extra headers for this request. */
  headers?: Record<string, string>;
}

/** A page of a list: the items, and the cursor for the next page. */
export interface Page<T> {
  /** This page's items. */
  data: T[];
  /** Pass as `cursor` for the next page; null on the last page. */
  next_cursor: string | null;
}

export const DEFAULT_BASE_URL = 'https://api.ballotdata.net';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 2;
/** Don't sleep longer than this on a Retry-After; a daily limit can ask for hours. */
const MAX_RETRY_AFTER_SECONDS = 60;

type Query = Record<string, unknown>;

function env(name: string): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.[name] || undefined;
}

/** Encode query values the way the API expects: lists comma-separated, booleans true/false, dates ISO. */
export function encodeQuery(query: Record<string, unknown> = {}): URLSearchParams {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(name, value.join(','));
    } else if (value instanceof Date) {
      params.set(name, value.toISOString());
    } else {
      params.set(name, String(value));
    }
  }
  return params;
}

function rateLimitFrom(headers: Headers): RateLimit {
  const num = (name: string) => {
    const v = headers.get(name);
    return v === null || v === '' || Number.isNaN(Number(v)) ? null : Number(v);
  };
  return {
    limit: num('ratelimit-limit'),
    remaining: num('ratelimit-remaining'),
    reset: num('ratelimit-reset'),
    dailyLimit: num('x-daily-limit'),
    dailyRemaining: num('x-daily-remaining'),
  };
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(done, ms);
    function done() {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }
    function onAbort() {
      clearTimeout(timer);
      reject(signal!.reason);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** An AbortSignal that fires when any of the given ones does. */
export function anySignal(signals: (AbortSignal | undefined)[]): AbortSignal {
  const list = signals.filter((s): s is AbortSignal => !!s);
  if (list.length === 1) return list[0]!;
  const any = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any;
  if (any) return any(list);
  const controller = new AbortController();
  for (const s of list) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener('abort', () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

/** Exponential backoff with jitter: about 0.5s, 1s, 2s … up to 8s. */
function backoffMs(attempt: number): number {
  return Math.min(8000, 500 * 2 ** attempt) * (0.75 + Math.random() * 0.5);
}

/** What the transport needs to make a request. */
export interface TransportRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: Query;
  body?: unknown;
  /** Extra headers. */
  headers?: Record<string, string>;
  options?: RequestOptions;
}

/** Sends requests to the API. Shared by every resource of one client. */
export class Transport {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly fetch: typeof fetch;
  readonly headers: Record<string, string>;
  readonly onResponse?: (info: ResponseInfo) => void;
  /** Facts about the most recent response: status, request id and rate-limit headers. */
  lastResponse: ResponseInfo | null = null;

  constructor(options: ClientOptions = {}) {
    const apiKey = options.apiKey ?? env('BALLOTDATA_API_KEY');
    if (!apiKey) {
      throw new Error(
        'No BallotData API key. Pass { apiKey } or set BALLOTDATA_API_KEY. ' +
          'Keys come with a purchase at https://ballotdata.net/pricing.',
      );
    }
    const f = options.fetch ?? (globalThis.fetch as typeof fetch | undefined);
    if (!f) throw new Error('No fetch available. Use Node 18 or newer, or pass { fetch }.');
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? env('BALLOTDATA_API_URL') ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.fetch = f.bind(globalThis);
    this.headers = options.headers ?? {};
    this.onResponse = options.onResponse;
  }

  /** The full URL for a path and query. */
  url(path: string, query?: Query): string {
    const qs = encodeQuery(query).toString();
    return `${this.baseUrl}${path}${qs ? `?${qs}` : ''}`;
  }

  /** Headers sent on every request. */
  baseHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
      ...this.headers,
    };
    // Browsers refuse to let scripts set User-Agent; everywhere else, say who we are.
    if (typeof (globalThis as { document?: unknown }).document === 'undefined') {
      headers['User-Agent'] = `ballotdata-js/${VERSION}`;
    }
    return headers;
  }

  /** Record a response for `lastResponse` and `onResponse`. */
  observe(method: string, url: string, res: Response): void {
    const info: ResponseInfo = {
      method,
      url,
      status: res.status,
      requestId: res.headers.get('x-request-id'),
      rateLimit: rateLimitFrom(res.headers),
    };
    this.lastResponse = info;
    this.onResponse?.(info);
  }

  /**
   * Fetch with a timeout, one attempt, no retries. Throws {@link TimeoutError}
   * or {@link ConnectionError}; aborting `signal` throws its reason. The
   * timeout keeps running while you read the body: call `release()` when done.
   */
  async send(
    url: string,
    init: RequestInit & { signal?: AbortSignal | null },
    timeout: number,
  ): Promise<{ res: Response; release: () => void }> {
    const timer = new AbortController();
    const handle = setTimeout(() => timer.abort(new TimeoutError(`No response from BallotData within ${timeout} ms.`)), timeout);
    const release = () => clearTimeout(handle);
    const signal = anySignal([init.signal ?? undefined, timer.signal]);
    try {
      return { res: await this.fetch(url, { ...init, signal }), release };
    } catch (err) {
      release();
      if (init.signal?.aborted) throw init.signal.reason;
      if (timer.signal.aborted) throw timer.signal.reason;
      throw new ConnectionError(`Could not reach BallotData: ${(err as Error)?.message ?? err}`, { cause: err });
    }
  }

  /** Read a body, turning an abort caused by the timeout into TimeoutError. */
  async #read<T>(read: () => Promise<T>, signal: AbortSignal | undefined): Promise<T> {
    try {
      return await read();
    } catch (err) {
      if (signal?.aborted) throw signal.reason;
      if (err instanceof TimeoutError) throw err;
      if ((err as Error)?.name === 'AbortError' || (err as Error)?.name === 'TimeoutError') {
        throw new TimeoutError('BallotData stopped sending the response before it finished.', { cause: err });
      }
      throw new ConnectionError(`The connection to BallotData failed: ${(err as Error)?.message ?? err}`, { cause: err });
    }
  }

  /** Make a request, retrying where it's safe, and return the parsed JSON (undefined for 204). */
  async request<T>({ method, path, query, body, headers, options = {} }: TransportRequest): Promise<T> {
    const url = this.url(path, query);
    const maxRetries = options.maxRetries ?? this.maxRetries;
    const timeout = options.timeout ?? this.timeout;
    const idempotent = method !== 'POST';
    const init: RequestInit = {
      method,
      headers: {
        ...this.baseHeaders(),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
        ...options.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    };

    for (let attempt = 0; ; attempt++) {
      let sent: { res: Response; release: () => void };
      let result: { ok: true; value: T } | { ok: false; error: ApiError };
      try {
        sent = await this.send(url, init, timeout);
        const { res } = sent;
        this.observe(method, url, res);
        try {
          result = res.ok
            ? { ok: true, value: res.status === 204 ? (undefined as T) : await this.#read(() => res.json() as Promise<T>, options.signal) }
            : { ok: false, error: await errorFromResponse(res) };
        } finally {
          sent.release();
        }
      } catch (err) {
        // A request that never got a full answer may or may not have been processed: only retry idempotent ones.
        const retryable = (err instanceof ConnectionError || err instanceof TimeoutError) && idempotent;
        if (!retryable || attempt >= maxRetries) throw err;
        await sleep(backoffMs(attempt), options.signal);
        continue;
      }
      if (result.ok) return result.value;

      const { error } = result;
      const res = sent.res;
      const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
      // 429 and 503 mean the request wasn't processed, so any method can retry.
      const retryable =
        ((res.status === 429 || res.status === 503) && (retryAfter === null || retryAfter <= MAX_RETRY_AFTER_SECONDS)) ||
        (idempotent && (res.status === 500 || res.status === 502 || res.status === 504));
      if (!retryable || attempt >= maxRetries) throw error;
      await sleep(retryAfter !== null ? retryAfter * 1000 : backoffMs(attempt), options.signal);
    }
  }

  /** A {@link PagePromise} over a paged list endpoint. */
  list<T>(path: string, query: Query = {}, options?: RequestOptions): PagePromise<T> {
    return new PagePromise<T>((cursor) =>
      this.request<Page<T>>({ method: 'GET', path, query: cursor ? { ...query, cursor } : query, options }),
      query.cursor as string | undefined,
    );
  }
}

/**
 * The result of a list method. Await it for the first page, or iterate it
 * with `for await` to walk every item across every page.
 *
 * ```ts
 * const page = await client.endorsements.list({ states: 'CA' });     // one page
 * for await (const e of client.endorsements.list({ states: 'CA' })) {} // every item
 * const all = await client.endorsements.list({ states: 'CA' }).toArray();
 * ```
 */
export class PagePromise<T> implements PromiseLike<Page<T>>, AsyncIterable<T> {
  #fetchPage: (cursor?: string) => Promise<Page<T>>;
  #startCursor?: string;
  #first?: Promise<Page<T>>;

  constructor(fetchPage: (cursor?: string) => Promise<Page<T>>, startCursor?: string) {
    this.#fetchPage = (cursor) => fetchPage(cursor);
    this.#startCursor = startCursor;
  }

  #firstPage(): Promise<Page<T>> {
    // Fetched once, when first awaited or iterated.
    return (this.#first ??= this.#fetchPage(this.#startCursor));
  }

  then<R1 = Page<T>, R2 = never>(
    onfulfilled?: ((value: Page<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.#firstPage().then(onfulfilled, onrejected);
  }

  catch<R = never>(onrejected?: ((reason: unknown) => R | PromiseLike<R>) | null): Promise<Page<T> | R> {
    return this.#firstPage().catch(onrejected);
  }

  /** Every page in turn, starting with the first. */
  async *pages(): AsyncGenerator<Page<T>, void, undefined> {
    let page = await this.#firstPage();
    yield page;
    while (page.next_cursor) {
      page = await this.#fetchPage(page.next_cursor);
      yield page;
    }
  }

  /** Every item on every page. */
  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    for await (const page of this.pages()) yield* page.data;
  }

  /**
   * Every item collected into an array. Mind large lists: pass `max` to stop
   * after that many items.
   */
  async toArray(max = Infinity): Promise<T[]> {
    const out: T[] = [];
    if (max <= 0) return out;
    for await (const item of this) {
      out.push(item);
      if (out.length >= max) break;
    }
    return out;
  }
}
