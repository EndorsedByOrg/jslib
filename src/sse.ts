/**
 * A Server-Sent Events parser, following the WHATWG rules. Browsers have
 * `EventSource`, but it can't send an Authorization header, so the stream is
 * read with `fetch` and parsed here.
 *
 * @module
 */

/** One parsed SSE message. */
export interface SseMessage {
  /** The `event:` field; `message` when there was none. Empty for a block that only set `id` or `retry`. */
  event: string;
  /** The `data:` lines joined with newlines. */
  data: string;
  /** The `id:` field, when the block had one. */
  id?: string;
  /** The `retry:` field in milliseconds, when the block had one. */
  retry?: number;
}

/**
 * Parse an SSE byte stream into messages. Comment lines (the API's `: ping`
 * heartbeat) are skipped. A block left unfinished when the stream ends is
 * dropped, as the SSE rules require.
 */
export async function* parseSse(body: AsyncIterable<Uint8Array>): AsyncGenerator<SseMessage, void, undefined> {
  const decoder = new TextDecoder();
  let buffer = '';
  let event = '';
  let data: string[] = [];
  let id: string | undefined;
  let retry: number | undefined;

  function* line(text: string): Generator<SseMessage> {
    if (text === '') {
      if (data.length || event) yield { event: event || 'message', data: data.join('\n'), id, retry };
      else if (id !== undefined || retry !== undefined) yield { event: '', data: '', id, retry };
      event = '';
      data = [];
      id = undefined;
      retry = undefined;
      return;
    }
    if (text.startsWith(':')) return;
    const colon = text.indexOf(':');
    const field = colon < 0 ? text : text.slice(0, colon);
    let value = colon < 0 ? '' : text.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'event') event = value;
    else if (field === 'data') data.push(value);
    else if (field === 'id' && !value.includes('\0')) id = value;
    else if (field === 'retry' && /^\d+$/.test(value)) retry = Number(value);
  }

  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    let match: RegExpExecArray | null;
    while ((match = /\r\n|\n|\r/.exec(buffer))) {
      // A lone \r at the end of what we have may be the first half of \r\n.
      if (match[0] === '\r' && match.index === buffer.length - 1) break;
      const text = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      yield* line(text);
    }
  }
}

/** A web ReadableStream as an async iterable, for runtimes whose streams aren't iterable yet (Safari). */
export async function* iterateBody(body: ReadableStream<Uint8Array>): AsyncGenerator<Uint8Array, void, undefined> {
  const reader = body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  } finally {
    // Stopped early (or finished): let go of the connection.
    reader.cancel().catch(() => {});
  }
}
