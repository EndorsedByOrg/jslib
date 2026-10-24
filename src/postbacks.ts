/**
 * Signed postbacks: BallotData POSTs each batch of endorsement changes to
 * your HTTPS endpoint, with a `BallotData-Signature` header.
 *
 * The header holds a timestamp `t` and `v1`, the hex HMAC-SHA256 of `t`, a
 * dot, and the raw body, keyed with the signing secret shown in your
 * ballotdata.net account. These helpers check it with the Web Crypto API, so
 * they work in Node, Deno, Bun, Cloudflare Workers and other edge runtimes.
 *
 * Always check the **raw** body, exactly as received. Parsing and
 * re-serializing the JSON changes the bytes and the signature won't match.
 *
 * ```ts
 * import { constructPostback } from 'ballotdata';
 *
 * app.post('/ballotdata', express.raw({ type: 'application/json' }), async (req, res) => {
 *   const postback = await constructPostback(req.body, req.get('BallotData-Signature'), process.env.BALLOTDATA_SIGNING_SECRET);
 *   for (const change of postback.changes) await handle(change); // use change.id to drop repeats
 *   res.sendStatus(204);
 * });
 * ```
 *
 * @module
 */

import { BallotDataError } from './errors.js';
import type { Postback } from './types.js';

/** The header BallotData signs postbacks with. */
export const SIGNATURE_HEADER = 'BallotData-Signature';

/** A raw request body: a string, bytes, or a Node Buffer (which is a Uint8Array). */
export type RawBody = string | Uint8Array | ArrayBuffer;

/** Options for {@link verifyPostbackSignature} and {@link constructPostback}. */
export interface VerifyOptions {
  /** Refuse signatures whose timestamp is further than this from now, in seconds. Default 300. */
  tolerance?: number;
  /** The current time in seconds since the epoch. For tests. */
  now?: number;
}

/** Thrown by {@link constructPostback} when a postback's signature is missing, wrong or too old. */
export class PostbackSignatureError extends BallotDataError {}

const encoder = new TextEncoder();

function bytes(body: RawBody): Uint8Array {
  if (typeof body === 'string') return encoder.encode(body);
  if (body instanceof Uint8Array) return body;
  return new Uint8Array(body);
}

function subtle(): SubtleCrypto {
  const s = (globalThis as { crypto?: Crypto }).crypto?.subtle;
  if (!s) throw new Error('Checking postback signatures needs the Web Crypto API (Node 20+, Deno, Bun, browsers, workers).');
  return s;
}

async function hmacHex(secret: string, t: number, body: RawBody): Promise<string> {
  const key = await subtle().importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prefix = encoder.encode(`${t}.`);
  const raw = bytes(body);
  const message = new Uint8Array(prefix.length + raw.length);
  message.set(prefix);
  message.set(raw, prefix.length);
  const mac = new Uint8Array(await subtle().sign('HMAC', key, message));
  return Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compare without stopping at the first difference, so timing reveals nothing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseHeader(header: string): { t: number; v1: string[] } {
  let t = NaN;
  const v1: string[] = [];
  for (const part of header.split(',')) {
    const [key, value = ''] = part.trim().split('=', 2);
    if (key === 't') t = Number(value);
    else if (key === 'v1') v1.push(value.toLowerCase());
  }
  return { t, v1 };
}

/**
 * Check a postback's `BallotData-Signature` header. Resolves true when it is
 * a valid signature of `rawBody` with `secret`, made within the tolerance
 * (five minutes by default).
 *
 * @param rawBody The request body exactly as received.
 * @param header The `BallotData-Signature` header, e.g. `"t=1760620800,v1=5f2b…"`.
 * @param secret Your signing secret, from your ballotdata.net account.
 * @example
 * if (!(await verifyPostbackSignature(rawBody, req.headers['ballotdata-signature'], secret))) {
 *   return res.writeHead(401).end();
 * }
 */
export async function verifyPostbackSignature(
  rawBody: RawBody,
  header: string | null | undefined,
  secret: string,
  options: VerifyOptions = {},
): Promise<boolean> {
  if (!header || !secret) return false;
  const { t, v1 } = parseHeader(header);
  if (!Number.isFinite(t) || !v1.length) return false;
  const now = options.now ?? Date.now() / 1000;
  if (Math.abs(now - t) > (options.tolerance ?? 300)) return false;
  const expected = await hmacHex(secret, t, rawBody);
  return v1.some((given) => safeEqual(given, expected));
}

/**
 * Check a postback's signature and parse it. Throws
 * {@link PostbackSignatureError} when the signature is missing, wrong or too
 * old.
 *
 * Answer within 15 seconds with any 2xx. Anything else is retried with
 * growing gaps of up to an hour, so a change can arrive twice: use each
 * change's `id` to drop repeats.
 */
export async function constructPostback(
  rawBody: RawBody,
  header: string | null | undefined,
  secret: string,
  options: VerifyOptions = {},
): Promise<Postback> {
  if (!header) throw new PostbackSignatureError(`No ${SIGNATURE_HEADER} header.`);
  if (!(await verifyPostbackSignature(rawBody, header, secret, options))) {
    throw new PostbackSignatureError(`The ${SIGNATURE_HEADER} header doesn't match this body and secret, or is too old.`);
  }
  const text = typeof rawBody === 'string' ? rawBody : new TextDecoder().decode(bytes(rawBody));
  return JSON.parse(text) as Postback;
}

/**
 * Make a `BallotData-Signature` header the way BallotData does. Use it to
 * test your endpoint.
 *
 * @param timestamp Seconds since the epoch. Default now.
 */
export async function signPostback(rawBody: RawBody, secret: string, timestamp = Math.floor(Date.now() / 1000)): Promise<string> {
  return `t=${timestamp},v1=${await hmacHex(secret, timestamp, rawBody)}`;
}
