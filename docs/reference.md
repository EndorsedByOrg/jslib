# Reference

Every class, method, parameter and type in `ballotdata`. For a tour, start with the
[README](../README.md).

- [`new BallotData(options)`](#new-ballotdataoptions)
- [Request options](#request-options)
- [`PagePromise`](#pagepromise)
- [states](#clientstates) · [coverage](#clientcoverage) · [elections](#clientelections) ·
  [contests](#clientcontests) · [endorserCategories](#clientendorsercategories) ·
  [endorsers](#clientendorsers) · [endorsements](#clientendorsements) ·
  [officeholders](#clientofficeholders) · [stream](#clientstream) · [events](#clientevents) ·
  [subscriptions](#clientsubscriptions)
- [Escape hatches: `request` and `paginate`](#escape-hatches)
- [Postbacks](#postbacks)
- [Helpers](#helpers)
- [Errors](#errors)
- [Types](#types)

Conventions:

- **List parameters** (shown as `ListParam`) take an array or a comma-separated string. Any of the
  values matches. At most 200 values.
- **`lang`** is `'en'` (default) or `'es'`. Spanish returns the state's Spanish ballot text where it
  publishes one (titles, choices, measure text, statements). Names are never translated.
- **`upcoming`** limits results to elections from yesterday on.
- Fields in responses keep the API's snake_case names.

## `new BallotData(options)`

```ts
import { BallotData } from 'ballotdata';
const client = new BallotData({ apiKey, baseUrl, timeout, maxRetries, fetch, headers, onResponse });
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `apiKey` | `string` | `process.env.BALLOTDATA_API_KEY` | Your key, `ebk_…`. The constructor throws without one. |
| `baseUrl` | `string` | `process.env.BALLOTDATA_API_URL`, then `https://api.ballotdata.net` | |
| `timeout` | `number` | `30000` | Milliseconds to wait for each response, body included. |
| `maxRetries` | `number` | `2` | See [retries](../README.md#retries-timeouts-and-cancelling). |
| `fetch` | `typeof fetch` | `globalThis.fetch` | |
| `headers` | `Record<string, string>` | `{}` | Sent on every request. |
| `onResponse` | `(info: ResponseInfo) => void` | | Called after every HTTP response, retried ones included. |

Properties:

| Property | Type | |
| --- | --- | --- |
| `baseUrl` | `string` | Where requests go. |
| `lastResponse` | `ResponseInfo \| null` | `{ method, url, status, requestId, rateLimit }` of the latest response. |

## Request options

Every method takes these as its last argument.

| Option | Type | |
| --- | --- | --- |
| `signal` | `AbortSignal` | Cancels the request and its retries; the promise rejects with the signal's reason. |
| `timeout` | `number` | Overrides the client's timeout for this request. |
| `maxRetries` | `number` | Overrides the client's retries for this request. |
| `headers` | `Record<string, string>` | Extra headers for this request. |

## `PagePromise`

Paged list methods (`elections.list`, `contests.list`, `endorsers.list`, `endorsements.list`,
`officeholders.list`, `paginate`) return a `PagePromise<T>`.

| Use | Gives |
| --- | --- |
| `await list` | The first page: `{ data: T[], next_cursor: string \| null }`. |
| `for await (const item of list)` | Every item on every page. |
| `list.pages()` | An async iterator of pages. |
| `list.toArray(max?)` | Every item (or the first `max`) in an array. |

The first page is fetched once, when you first await or iterate. Pass `cursor` in the parameters to
start from a later page.

---

## `client.states`

### `states.list(options?)` → `Promise<State[]>`

`GET /v1/states`. Every state, D.C. and territory with its USPS code (for `states` filters) and FIPS
code.

## `client.coverage`

### `coverage.list(params?, options?)` → `Promise<Coverage[]>`

`GET /v1/coverage`. One row per state: elections, contests, measures, endorsers and endorsements, and
when they last changed.

| Parameter | Type | Default | |
| --- | --- | --- | --- |
| `upcoming` | `boolean` | `true` | Count only upcoming elections. |

## `client.elections`

### `elections.list(params?, options?)` → `PagePromise<ElectionSummary>`

`GET /v1/elections`. Elections with their voting rules and counts of contests and endorsements.

| Parameter | Type | |
| --- | --- | --- |
| `states` | `ListParam<StateCode>` | USPS codes. |
| `types` | `ListParam<ElectionType>` | `general`, `primary`, `special`, `special_primary`, `runoff`, `consolidated`. |
| `upcoming` | `boolean` | Only elections from yesterday on. |
| `from` | `string` (date) | On or after this date. |
| `to` | `string` (date) | On or before this date. |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

## `client.contests`

### `contests.list(params?, options?)` → `PagePromise<Contest>`

`GET /v1/contests`. The races on the ballot, each with its district, election, voting rules and every
choice in ballot order.

| Parameter | Type | |
| --- | --- | --- |
| `elections` | `ListParam` | Election slugs, e.g. `ca-2026-11-03-general`. |
| `states` | `ListParam<StateCode>` | |
| `levels` | `ListParam<Level>` | `federal`, `state`, `county`, `city`, `school`, `special`. |
| `contest_kinds` | `ListParam<ContestKind>` | `candidate`, `measure`, `retention`. |
| `districts` | `ListParam` | OCD division ids. |
| `upcoming` | `boolean` | |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–200, default 50. |
| `cursor` | `string` | |

### `contests.get(id, params?, options?)` → `Promise<ContestDetail>`

`GET /v1/contests/{id}`. One contest with its choices and every endorser's position (`endorsements`,
an array of `{ endorser, picks }`). Throws `NotFoundError`.

| Parameter | Type | |
| --- | --- | --- |
| `categories` | `ListParam` | Only endorsers in these categories. |
| `endorsers` | `ListParam` | Only these endorsers (slugs). |
| `endorser_states` | `ListParam` | Only endorsers based in these states, or `national`. |
| `lang` | `'en' \| 'es'` | |

## `client.endorserCategories`

### `endorserCategories.list(params?, options?)` → `Promise<EndorserCategory[]>`

`GET /v1/endorser-categories`. Every category in display order with how many endorsers it has.

| Parameter | Type |
| --- | --- |
| `lang` | `'en' \| 'es'` |

## `client.endorsers`

### `endorsers.list(params?, options?)` → `PagePromise<Endorser>`

`GET /v1/endorsers`.

| Parameter | Type | |
| --- | --- | --- |
| `categories` | `ListParam` | Category slugs. |
| `states` | `ListParam` | Home states, or `national`. |
| `elections` | `ListParam` | Only endorsers with endorsements in these elections. |
| `q` | `string` | Name contains (case-insensitive, up to 100 characters). |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

### `endorsers.get(slug, params?, options?)` → `Promise<EndorserDetail>`

`GET /v1/endorsers/{slug}`. One endorser with the elections they've endorsed in, newest first.
Throws `NotFoundError`.

| Parameter | Type |
| --- | --- |
| `lang` | `'en' \| 'es'` |

## `client.endorsements`

### `endorsements.list(params?, options?)` → `PagePromise<Endorsement>`

`GET /v1/endorsements`. One row per endorser and choice, with its endorser, contest (district and
election included) and choice. A ranked-choice endorsement of three candidates is three rows with
ranks 1–3.

| Parameter | Type | |
| --- | --- | --- |
| `categories` | `ListParam` | Endorser categories. |
| `endorsers` | `ListParam` | Endorser slugs. |
| `endorser_states` | `ListParam` | Endorsers' home states, or `national`. |
| `elections` | `ListParam` | Election slugs. |
| `states` | `ListParam<StateCode>` | States the contests are voted in. |
| `contest_kinds` | `ListParam<ContestKind>` | |
| `levels` | `ListParam<Level>` | |
| `contest` | `number` | Only this contest. |
| `upcoming` | `boolean` | |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

## `client.officeholders`

### `officeholders.list(params?, options?)` → `PagePromise<Officeholder>`

`GET /v1/officeholders`. People in office now (federal and state offices, and the D.C. Council), from
Open States.

| Parameter | Type | |
| --- | --- | --- |
| `states` | `ListParam<StateCode>` | |
| `offices` | `ListParam<Office>` | `us_senator`, `us_representative`, `governor`, `lieutenant_governor`, `attorney_general`, `secretary_of_state`, `chief_election_officer`, `treasurer`, `auditor`, `state_senator`, `state_representative`, `state_legislator`, `city_council`. |
| `levels` | `ListParam` | `federal`, `state`, `city`. |
| `districts` | `ListParam` | OCD division ids of the seats. |
| `q` | `string` | Name contains. |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

### `officeholders.get(personId, params?, options?)` → `Promise<OfficeholderDetail>`

`GET /v1/officeholders/{id}`. One officeholder by `person_id`, with every seat they hold (`seats`).
Throws `NotFoundError`.

## `client.stream`

Stream parameters, shared by `stream.connect`, `stream.endorsements`, `events.list` and
`events.follow`. Give a `subscription` or filter fields, not both.

| Parameter | Type | |
| --- | --- | --- |
| `subscription` | `string \| number` | A saved subscription's id or name. |
| `categories` | `ListParam` | |
| `endorsers` | `ListParam` | |
| `endorser_states` | `ListParam` | |
| `states` | `ListParam<StateCode>` | |
| `elections` | `ListParam` | |
| `contest_kinds` | `ListParam<ContestKind>` | |
| `levels` | `ListParam<Level>` | |
| `types` | `ListParam<'created' \| 'updated' \| 'deleted'>` | |
| `cursor` | `string` | Resume after this position. |
| `from` | `'latest' \| 'earliest'` | Where to start without a cursor. Default `latest`. |
| `since` | `string \| Date` | Start at changes from this time, within the stream's retention. |

### `stream.connect(params?, options?)` → `EndorsementStream`

`GET /v1/stream`. Returns at once; the connection opens when you start iterating. Yields
`StreamMessage`:

```ts
type StreamMessage =
  | { type: 'ready'; subscription: string | null; cursor: string | undefined }
  | { type: 'endorsement'; event: EndorsementEvent; cursor: string };
```

| Option | Type | Default | |
| --- | --- | --- | --- |
| `onCursor` | `(cursor: string) => void` | | Called whenever the position moves. Save it. |
| `signal` | `AbortSignal` | | Abort; iteration throws the signal's reason. |
| `reconnect` | `boolean` | `true` | Reconnect after `reconnect`, drops, silence, 429/503. |
| `idleTimeout` | `number` | `60000` | Milliseconds of silence before a connection counts as dead. |
| `maxReconnectDelay` | `number` | `60000` | Longest wait between reconnect attempts. |
| `onReconnect` | `(info) => void` | | `{ attempt, delayMs, reason, error? }` before each reconnect; `reason` is `reconnect`, `dropped`, `idle`, `busy` or `unreachable`. |

`EndorsementStream` has:

| Member | |
| --- | --- |
| `cursor` | The latest position. |
| `subscription` | The subscription name, or `"inline"`, once connected. |
| `close()` | Stop; a `for await` loop ends normally. |
| `closed` | Whether `close()` was called. |

A stream can be iterated once. Iteration throws `CursorExpiredError` (position too old),
`PermissionDeniedError` (`no_access` when the purchase ends, `insufficient_scope`),
`AuthenticationError`, `NotFoundError` (`subscription_not_found`) and `BadRequestError`.

### `stream.endorsements(params?, options?)` → `AsyncGenerator<{ event, cursor }>`

The same as `connect`, yielding only endorsement events.

## `client.events`

### `events.list(params?, options?)` → `Promise<EventsPage>`

`GET /v1/events`. Takes the stream parameters plus:

| Parameter | Type | |
| --- | --- | --- |
| `limit` | `number` | Events per page, 1–1000, default 100. |
| `wait` | `number` | Seconds (0–25) to wait for a matching change. Default 0. |

Returns `{ data: EndorsementEvent[], next_cursor: string, has_more: boolean }`. Send `next_cursor`
as `cursor` next time; `has_more` means call again now. The request timeout is raised to cover
`wait`. Throws `CursorExpiredError`.

### `events.follow(params?, options?)` → `AsyncGenerator<{ event, cursor }>`

Long-polls forever (default `wait: 20`). Network trouble is retried with backoff; API errors are
thrown. Options: `onCursor`, `signal`, `maxRetries`, `headers`. The `cursor` yielded with each event
is the end of its page, so resuming from it after a crash mid-page skips nothing but may repeat that
page's later events: drop repeats by `event.id`.

## `client.subscriptions`

Saved filters. Reading needs `stream:read`; changing needs `subscriptions:write`. Up to 50 per account.

| Method | Endpoint | Returns | Throws |
| --- | --- | --- | --- |
| `list(options?)` | `GET /v1/subscriptions` | `Subscription[]` | |
| `get(id, options?)` | `GET /v1/subscriptions/{id}` | `Subscription` | `NotFoundError` |
| `create(input, options?)` | `POST /v1/subscriptions` | `Subscription` | `ConflictError` |
| `update(id, input, options?)` | `PUT /v1/subscriptions/{id}` | `Subscription` | `NotFoundError`, `ConflictError` |
| `delete(id, options?)` | `DELETE /v1/subscriptions/{id}` | `void` | `NotFoundError` |

`input` is `{ name, filter? }`. `name` is 1–100 letters, digits, spaces, dots, dashes or underscores.
`update` replaces the whole subscription. Open streams keep the old filter until they reconnect.

## Escape hatches

### `client.request(method, path, { query, body }, options?)` → `Promise<T>`

Calls any endpoint with the client's key, retries and errors, and returns the parsed JSON body.

### `client.paginate(path, query?, options?)` → `PagePromise<T>`

Walks any `{ data, next_cursor }` list endpoint.

## Postbacks

```ts
import { verifyPostbackSignature, constructPostback, signPostback, PostbackSignatureError, SIGNATURE_HEADER } from 'ballotdata';
```

| Function | Returns | |
| --- | --- | --- |
| `verifyPostbackSignature(rawBody, header, secret, { tolerance?, now? })` | `Promise<boolean>` | True for a valid signature within `tolerance` seconds (default 300). |
| `constructPostback(rawBody, header, secret, { tolerance?, now? })` | `Promise<Postback>` | Checks, then parses. Throws `PostbackSignatureError`. |
| `signPostback(rawBody, secret, timestamp?)` | `Promise<string>` | A header made the way BallotData makes it, for tests. |

`rawBody` is a `string`, `Uint8Array` (a Node `Buffer` is one) or `ArrayBuffer`: the body exactly as
received. `SIGNATURE_HEADER` is `'BallotData-Signature'`. A `Postback` is
`{ delivery_id, sent_at, changes: EndorsementEvent[] }`.

## Helpers

| Function | |
| --- | --- |
| `groupByContest(endorsements)` | Groups `Endorsement` rows into `{ contest, positions: [{ endorser, picks }] }`, picks ranked first-to-last. |
| `sortPicks(picks)` | Picks sorted by `rank` (unranked last, in their order). |
| `parseSse(body)` | The SSE parser the stream uses: an async iterator of `{ event, data, id?, retry? }` from a byte stream. |
| `encodeQuery(query)` | `URLSearchParams` the way the API wants them: lists joined with commas, booleans as `true`/`false`, dates as ISO. |
| `VERSION` | This library's version. |
| `DEFAULT_BASE_URL` | `'https://api.ballotdata.net'`. |

## Errors

See [errors.md](errors.md).

## Types

All exported from the package root. The main ones:

| Type | What |
| --- | --- |
| `State`, `Party`, `Category`, `EndorserCategory`, `Coverage` | Reference data. |
| `Election`, `ElectionSummary`, `ElectionDetails` | Elections. |
| `District`, `Contest`, `ContestBase`, `ContestDetail`, `ContestDetails`, `Choice`, `Candidate` | Ballots. |
| `Position`, `Pick` | An endorser's picks in a contest. |
| `EndorserRef`, `Endorser`, `EndorserDetail`, `EndorserElection` | Endorsers. |
| `Endorsement`, `EndorsedChoice` | Endorsements. |
| `Officeholder`, `OfficeholderDetail` | Officeholders. |
| `EndorsementEvent`, `EventsPage`, `Filter`, `Subscription`, `SubscriptionInput`, `Postback` | Stream. |
| `List…Params`, `GetContestParams`, `StreamParams`, `ListEventsParams`, `CoverageParams`, `LangParams`, `PageParams` | Parameters. |
| `VoteMethod`, `ContestKind`, `Level`, `ElectionType`, `PrimarySystem`, `MeasureAnswer`, `Office`, `EventType`, `ChangeType`, `ErrorCode`, `Lang` | Enums. |
| `ClientOptions`, `RequestOptions`, `Page`, `ResponseInfo`, `RateLimit`, `StreamOptions`, `StreamMessage`, `FollowOptions` | Client. |

Each field is documented in the type definitions (`dist/*/types.d.ts`), which editors show as you
type. `npm run docs` builds browsable HTML of all of it.
