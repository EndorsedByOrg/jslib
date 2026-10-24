# Errors

Everything the library throws on purpose extends `BallotDataError`.

```
BallotDataError
├── ApiError                 the API answered with an error
│   ├── BadRequestError        400
│   ├── AuthenticationError    401
│   ├── PermissionDeniedError  403
│   ├── NotFoundError          404
│   ├── ConflictError          409
│   ├── CursorExpiredError     410
│   ├── PayloadTooLargeError   413
│   ├── RateLimitError         429  (retryAfter: seconds | null)
│   └── InternalServerError    5xx
├── ConnectionError          the API couldn't be reached
├── TimeoutError             no answer within the timeout
└── PostbackSignatureError   a postback's signature is missing, wrong or too old
```

An `ApiError` has:

| Property | |
| --- | --- |
| `status` | The HTTP status. |
| `code` | The API's machine-readable code (below). |
| `message` | The API's message, in plain English. |
| `requestId` | Quote this when you write to sales@ballotdata.net. |
| `headers` | The response headers. |

A cancelled request rejects with the `AbortSignal`'s reason, not a `BallotDataError`.

## Codes

| Code | Status | Meaning | What to do |
| --- | --- | --- | --- |
| `missing_api_key` | 401 | No key was sent. | Set `apiKey` or `BALLOTDATA_API_KEY`. |
| `invalid_api_key` | 401 | The key isn't valid. | Check it in the console. |
| `revoked_api_key` | 401 | The key was revoked. | Create a new key. |
| `expired_api_key` | 401 | The key expired. | Create a new key. |
| `ip_not_allowed` | 403 | The key is limited to other IP addresses. | Add this server's address to the key. |
| `account_pending` | 403 | The account isn't active yet. | |
| `account_suspended` | 403 | The account is suspended. | Write to sales@ballotdata.net. |
| `account_closed` | 403 | The account is closed. | |
| `insufficient_scope` | 403 | The key lacks a scope (`data:read`, `stream:read`, `subscriptions:write`). | Add the scope to the key. |
| `no_access` | 403 | The account has no API data, or its purchase ended. | Buy at ballotdata.net/pricing with your account's email. |
| `outside_purchase` | 403 | You asked about data the account didn't buy (another state, say). | Narrow the request, or buy more. |
| `invalid_parameter` | 400 | A parameter isn't valid. | The message names it. |
| `invalid_cursor` | 400 | The cursor isn't one the API made. | |
| `invalid_filter` | 400 | A filter field isn't valid. | |
| `invalid_json` | 400 | The body isn't JSON. | |
| `invalid_subscription` | 400 | The subscription's name or filter isn't valid. | |
| `body_too_large` | 413 | The body is too large. | |
| `not_found` | 404 | Nothing has that id or slug. | |
| `subscription_not_found` | 404 | No subscription has that id or name. | |
| `conflict` | 409 | A subscription with that name exists. | |
| `rate_limit_exceeded` | 429 | Over your per-minute limit. | Retried for you after `Retry-After`. |
| `daily_limit_exceeded` | 429 | Over your daily limit (UTC). | Wait for the next UTC day. |
| `too_many_requests`, `too_many_failures` | 429 | Too many requests, or too many failed ones. | Slow down. |
| `too_many_streams` | 429 | Your plan's open streams are all in use. | Close one; the stream retries after `Retry-After`. |
| `cursor_expired` | 410 | The position is older than the stream keeps. | Sync with `endorsements.list()`, start again from `latest`. |
| `warming_up` | 503 | The stream is still loading on this server. | Retried for you. |
| `server_busy` | 503 | The server has too many open streams. | Retried for you. |
| `not_available` | 503 | Officeholder data isn't loaded yet. | Try again later. |
| `internal_error` | 500 | Something went wrong at BallotData. | Retried for GET; write in with the request id if it persists. |

Codes the API adds later come through as plain strings in `code`.
