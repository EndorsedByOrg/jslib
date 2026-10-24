/**
 * Errors thrown by the client.
 *
 * Every error the API answers with becomes an {@link ApiError} (or one of its
 * subclasses, chosen by HTTP status), carrying the API's `code`, its message
 * and the request id. Problems reaching the API at all become
 * {@link ConnectionError} or {@link TimeoutError}.
 *
 * ```ts
 * try {
 *   await client.contests.get(4410);
 * } catch (err) {
 *   if (err instanceof NotFoundError) …
 *   else if (err instanceof ApiError && err.code === 'outside_purchase') …
 *   else throw err;
 * }
 * ```
 *
 * @module
 */

import type { ErrorCode } from './types.js';

/** Base class for everything this library throws on purpose. */
export class BallotDataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The API answered with an error: `{ "error": { "code", "message", "request_id" } }`. */
export class ApiError extends BallotDataError {
  /** HTTP status. */
  readonly status: number;
  /** Machine-readable code, e.g. `"outside_purchase"`. Codes the API adds later come through as plain strings. */
  readonly code: ErrorCode | (string & {});
  /** Request id from the error body or the X-Request-Id header. Quote it when you write to BallotData. */
  readonly requestId: string | null;
  /** The response headers. */
  readonly headers: Headers;

  constructor(status: number, code: string, message: string, requestId: string | null, headers: Headers = new Headers()) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.headers = headers;
  }
}

/** 400: a parameter is missing or not valid (`invalid_parameter`, `invalid_cursor`, `invalid_filter`, `invalid_json`, …). */
export class BadRequestError extends ApiError {}

/** 401: no API key, or one that isn't valid, was revoked or expired. */
export class AuthenticationError extends ApiError {}

/**
 * 403: the key can't be used for this. A missing scope (`insufficient_scope`),
 * an IP allowlist (`ip_not_allowed`), an account not active, or data the
 * account hasn't bought (`no_access`, `outside_purchase`).
 */
export class PermissionDeniedError extends ApiError {}

/** 404: nothing has that id or slug (`not_found`, `subscription_not_found`). */
export class NotFoundError extends ApiError {}

/** 409: a subscription with that name already exists. */
export class ConflictError extends ApiError {}

/**
 * 410 `cursor_expired`: the position is older than the stream keeps. Catch up
 * with `client.endorsements.list()`, then start again with `from: 'latest'`.
 */
export class CursorExpiredError extends ApiError {}

/** 413: the request body is too large. */
export class PayloadTooLargeError extends ApiError {}

/** 429: over a rate limit (`rate_limit_exceeded`, `daily_limit_exceeded`) or holding too many streams (`too_many_streams`). */
export class RateLimitError extends ApiError {
  /** Seconds the API asked you to wait (the Retry-After header), or null. */
  get retryAfter(): number | null {
    return parseRetryAfter(this.headers.get('retry-after'));
  }
}

/** 500 or above: something went wrong at BallotData. 503 `warming_up` and `server_busy` are retried for you first. */
export class InternalServerError extends ApiError {}

/** The API couldn't be reached: DNS, TLS, a refused or dropped connection. */
export class ConnectionError extends BallotDataError {}

/** The API didn't answer within the `timeout`. */
export class TimeoutError extends BallotDataError {}

/** Build the right {@link ApiError} subclass for a status. */
export function errorFor(status: number, code: string, message: string, requestId: string | null, headers: Headers): ApiError {
  const Class =
    status === 400 ? BadRequestError
    : status === 401 ? AuthenticationError
    : status === 403 ? PermissionDeniedError
    : status === 404 ? NotFoundError
    : status === 409 ? ConflictError
    : status === 410 || code === 'cursor_expired' ? CursorExpiredError
    : status === 413 ? PayloadTooLargeError
    : status === 429 ? RateLimitError
    : status >= 500 ? InternalServerError
    : ApiError;
  return new Class(status, code, message, requestId, headers);
}

/** Read an error response into an {@link ApiError}. */
export async function errorFromResponse(res: Response): Promise<ApiError> {
  const headerId = res.headers.get('x-request-id');
  let code = 'http_error';
  let message = res.statusText || `HTTP ${res.status}`;
  let requestId = headerId;
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string; request_id?: string } };
    if (body?.error?.code) {
      code = body.error.code;
      message = body.error.message ?? message;
      requestId = body.error.request_id ?? headerId;
    }
  } catch {
    // Not JSON (a proxy's error page, say): keep the status text.
  }
  return errorFor(res.status, code, message, requestId, res.headers);
}

/** Seconds from a Retry-After header (seconds or an HTTP date), or null. */
export function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, (date - Date.now()) / 1000);
}
