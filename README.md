# ballotdata

The official JavaScript and TypeScript client for the [BallotData API](https://api.ballotdata.net/docs):
U.S. ballots (elections, contests and their choices), endorsers and endorsements, officeholders,
and the live **Endorsement Stream** of changes.

- Covers every endpoint of the API, with full TypeScript types.
- Works from plain JavaScript (`import` or `require`) and TypeScript.
- No dependencies. Runs on Node 20+, Deno, Bun, and edge runtimes such as Cloudflare Workers.
- Handles the details: retries with `Retry-After`, timeouts, typed errors, paging, and a
  stream that reconnects and resumes where it stopped.

```sh
npm install ballotdata
```

```js
import { BallotData } from 'ballotdata';

const client = new BallotData(); // reads BALLOTDATA_API_KEY

const contest = await client.contests.get(4410, { categories: 'labor' });
for (const { endorser, picks } of contest.endorsements) {
  console.log(endorser.name, picks.map((p) => p.label));
}
```

## Contents

- [Getting an API key](#getting-an-api-key)
- [Setting up the client](#setting-up-the-client)
- [What you can ask for](#what-you-can-ask-for)
- [Paging](#paging)
- [Ballots: contests, choices and voting rules](#ballots-contests-choices-and-voting-rules)
- [Endorsers and endorsements](#endorsers-and-endorsements)
- [The Endorsement Stream](#the-endorsement-stream)
- [Polling instead of streaming](#polling-instead-of-streaming)
- [Subscriptions](#subscriptions)
- [Postbacks (signed webhooks)](#postbacks-signed-webhooks)
- [Errors](#errors)
- [Retries, timeouts and cancelling](#retries-timeouts-and-cancelling)
- [Rate limits](#rate-limits)
- [TypeScript](#typescript)
- [Runtimes](#runtimes)
- [More documentation](#more-documentation)

## Getting an API key

API accounts come with a purchase at [ballotdata.net/pricing](https://ballotdata.net/pricing). Once
it goes through, sign in at [api.ballotdata.net](https://api.ballotdata.net/login) and create a key
in the [console](https://api.ballotdata.net/console/keys).

A key covers what your account bought. Asking about another state answers `403 outside_purchase`.
Keys have scopes: `data:read` for the data endpoints, `stream:read` for the stream, polling and
reading subscriptions, and `subscriptions:write` to change subscriptions.

Keep keys on servers. Never put one in a browser page or a mobile app.

## Setting up the client

```js
// ES modules
import { BallotData } from 'ballotdata';
// CommonJS
const { BallotData } = require('ballotdata');

const client = new BallotData({
  apiKey: process.env.BALLOTDATA_API_KEY, // the default, so you can leave it out
  timeout: 30_000,                        // ms to wait for each response (default 30 000)
  maxRetries: 2,                          // retries for 429, 503, network errors (default 2)
});
```

| Option | Default | What it does |
| --- | --- | --- |
| `apiKey` | `BALLOTDATA_API_KEY` | Your key, `ebk_…`. |
| `baseUrl` | `BALLOTDATA_API_URL`, then `https://api.ballotdata.net` | Where requests go. |
| `timeout` | `30000` | Milliseconds to wait for each response. |
| `maxRetries` | `2` | Retries after 429, 503, network errors and timeouts, and 500/502/504 on GET, PUT and DELETE. `0` turns retries off. |
| `fetch` | global `fetch` | A `fetch` to use instead (a proxy agent, tests). |
| `headers` | `{}` | Extra headers on every request. |
| `onResponse` | none | Called with `{ method, url, status, requestId, rateLimit }` after every response. |

Every method also takes a last argument of per-request options: `{ signal, timeout, maxRetries, headers }`.

## What you can ask for

| Method | Endpoint | Returns |
| --- | --- | --- |
| `client.states.list()` | `GET /v1/states` | `State[]` |
| `client.coverage.list({ upcoming })` | `GET /v1/coverage` | `Coverage[]` |
| `client.elections.list(params)` | `GET /v1/elections` | pages of `ElectionSummary` |
| `client.contests.list(params)` | `GET /v1/contests` | pages of `Contest` |
| `client.contests.get(id, params)` | `GET /v1/contests/{id}` | `ContestDetail` (with every endorser's position) |
| `client.endorserCategories.list({ lang })` | `GET /v1/endorser-categories` | `EndorserCategory[]` |
| `client.endorsers.list(params)` | `GET /v1/endorsers` | pages of `Endorser` |
| `client.endorsers.get(slug, { lang })` | `GET /v1/endorsers/{slug}` | `EndorserDetail` |
| `client.endorsements.list(params)` | `GET /v1/endorsements` | pages of `Endorsement` (the basics) |
| `client.endorsements.get(id, { lang })` | `GET /v1/endorsements/{id}` | `EndorsementDetail` (the full record) |
| `client.officeholders.list(params)` | `GET /v1/officeholders` | pages of `Officeholder` |
| `client.officeholders.get(personId, { lang })` | `GET /v1/officeholders/{id}` | `OfficeholderDetail` |
| `client.stream.connect(params, options)` | `GET /v1/stream` | a live `EndorsementStream` |
| `client.events.list(params)` | `GET /v1/events` | `EventsPage` |
| `client.events.follow(params, options)` | `GET /v1/events` (long polling) | changes, forever |
| `client.subscriptions.list()` | `GET /v1/subscriptions` | `Subscription[]` |
| `client.subscriptions.create(input)` | `POST /v1/subscriptions` | `Subscription` |
| `client.subscriptions.get(id)` | `GET /v1/subscriptions/{id}` | `Subscription` |
| `client.subscriptions.update(id, input)` | `PUT /v1/subscriptions/{id}` | `Subscription` |
| `client.subscriptions.delete(id)` | `DELETE /v1/subscriptions/{id}` | nothing |
| `verifyPostbackSignature()`, `constructPostback()` | your endpoint | checks and parses postbacks |

Every parameter of every method is listed in the [reference](docs/reference.md). List parameters
take an array or a comma-separated string: `states: ['CA', 'NV']` and `states: 'CA,NV'` mean the same.
Ballot text comes in Spanish with `lang: 'es'` where the state publishes it.

## Paging

List methods return a `PagePromise`. Await it for one page, or loop over it with `for await` to get
every item, fetching pages as you go:

```js
// One page: { data, next_cursor }
const page = await client.endorsements.list({ states: 'CA', limit: 500 });

// Every item, across every page
for await (const endorsement of client.endorsements.list({ states: 'CA', limit: 500 })) {
  await save(endorsement);
}

// Every item in an array (pass a maximum for big lists)
const all = await client.endorsers.list({ categories: 'labor' }).toArray(1000);

// Page by page
for await (const page of client.contests.list({ elections: 'ca-2026-11-03-general' }).pages()) {
  console.log(page.data.length, page.next_cursor);
}
```

To page by hand, pass the last page's `next_cursor` as `cursor`.

## Ballots: contests, choices and voting rules

A contest's `vote_method` says how it is voted, and its choices are in ballot order:

| `vote_method` | Meaning | Look at |
| --- | --- | --- |
| `plurality` | Vote for one | `votes_allowed` (1) |
| `multi_seat` | Vote for up to N | `votes_allowed` |
| `ranked_choice` | Rank up to N | `ranks_allowed`, and each pick's `rank` |
| `approval` | Vote for as many as you like | |
| `yes_no` | A measure or retention question | each choice's `measure_answer` |

```js
const { data: [election] } = await client.elections.list({ states: 'CA', types: 'general', upcoming: true });

for await (const contest of client.contests.list({ elections: election.slug })) {
  const rule = contest.vote_method === 'ranked_choice' ? `rank up to ${contest.ranks_allowed}` : `vote for ${contest.votes_allowed}`;
  console.log(`${contest.title} (${rule}): ${contest.choices.map((c) => c.label).join(', ')}`);
}
```

`client.contests.get(id)` adds every endorser's position. Each position's `picks` hold one pick for
vote-for-one, up to N for vote-for-N, the ranking for ranked choice, or Yes/No for a measure:

```js
const contest = await client.contests.get(4410, { categories: ['labor', 'editorial'] });
for (const { endorser, picks } of contest.endorsements) {
  const marks = picks.map((p) => (p.rank ? `${p.rank}. ${p.label}` : p.label)).join('  ');
  console.log(`${endorser.name}: ${marks}`);
}
```

## Endorsers and endorsements

```js
// The kinds of endorser, for categories filters
const categories = await client.endorserCategories.list();

// Find endorsers by category, home state (or 'national'), election, or name
const { data: unions } = await client.endorsers.list({ categories: 'labor', states: 'CA', q: 'council' });

// One endorser and the elections they endorsed in
const endorser = await client.endorsers.get('sf-labor-council');
```

`client.endorsements.list()` returns one row per endorser and choice with the basics: the endorser,
contest and election (ids, slugs and names), the choice and its rank. It is the way to sync
everything. A ranked-choice endorsement of three candidates is three rows with ranks 1 to 3.
`client.endorsements.get(id)` has the full record: the statement and source, the endorser's details,
the contest with its district, election and voting rules, and the choice with its candidate.

```js
const e = await client.endorsements.get(90211);
console.log(e.endorser.category.name, e.contest.vote_method, e.choice.candidate?.full_name, e.statement, e.source_url);
```

`groupByContest()` turns rows back into positions:

```js
import { groupByContest } from 'ballotdata';

const rows = await client.endorsements
  .list({ endorsers: 'sf-labor-council', elections: 'ca-2026-11-03-general', limit: 500 })
  .toArray();
for (const { contest, positions } of groupByContest(rows)) {
  console.log(contest.title, positions[0].picks.map((p) => p.label));
}
```

## The Endorsement Stream

`client.stream.connect()` opens `GET /v1/stream` and yields every endorsement change that matches
your filter (or saved subscription), within seconds of it happening.

```js
const stream = client.stream.connect(
  { states: ['CA', 'NV'], categories: 'labor', cursor: await loadCursor() },
  { onCursor: (cursor) => saveCursor(cursor) },
);

for await (const message of stream) {
  if (message.type === 'ready') console.log('connected');
  if (message.type === 'endorsement') {
    const { type, endorser, choice, contest } = message.event; // type: endorsement.created | updated | deleted
    console.log(type, endorser.name, choice.label, contest.title);
  }
}
```

The stream keeps its place for you:

- Each event moves the **cursor**. Save it in `onCursor` and pass it back as `cursor` after a
  restart to continue exactly where you stopped. Without a cursor the stream starts at
  `from: 'latest'` (or `'earliest'`, or `since: date`).
- It **reconnects** with the cursor after the API's hourly `reconnect`, a dropped connection, a
  connection that goes silent for a minute (`idleTimeout`), or a 429/503 (after `Retry-After`).
  Nothing is missed or repeated.
- `checkpoint` events move the cursor past changes your filter skipped. You don't see them; the
  cursor just moves.
- If the cursor is older than the stream keeps, iteration throws `CursorExpiredError`. Catch up with
  `client.endorsements.list()` and start again with `from: 'latest'`.
- `stream.close()` ends the loop quietly. Aborting `signal` ends it with the signal's reason.

`client.stream.endorsements(params, options)` does the same and yields only `{ event, cursor }`.

The stream needs a key with `stream:read` and a purchase that includes the stream. Read it from a
server: browsers' `EventSource` can't send the API key. The [stream guide](docs/stream.md) covers
syncing first, recovering from an expired cursor, and running in serverless functions.

## Polling instead of streaming

Where a connection can't stay open (serverless functions, cron, some proxies), read the same changes
from `GET /v1/events`:

```js
// One page; wait up to 20 s for something new
const page = await client.events.list({ subscription: 'CA labor', cursor, wait: 20 });
// page.data, page.next_cursor, page.has_more

// Or forever
for await (const { event, cursor } of client.events.follow({ states: 'CA', cursor: await loadCursor() })) {
  await handle(event);
  await saveCursor(cursor);
}
```

## Subscriptions

A subscription is a saved filter. Use it by id or name as `subscription` on the stream and on events.

```js
const sub = await client.subscriptions.create({ name: 'CA labor', filter: { categories: ['labor'], states: ['CA'] } });
const all = await client.subscriptions.list();
await client.subscriptions.update(sub.id, { name: 'CA labor', filter: { categories: ['labor'], states: ['CA', 'NV'] } });
await client.subscriptions.delete(sub.id);

for await (const message of client.stream.connect({ subscription: 'CA labor' })) { … }
```

A filter's fields combine with AND and the values within a field with OR: `categories`, `endorsers`,
`endorser_states`, `states`, `elections`, `contest_kinds`, `levels`, and `types`
(`created`, `updated`, `deleted`). An account can have up to 50.

## Postbacks (signed webhooks)

With postbacks, BallotData POSTs each batch of changes to your HTTPS endpoint, signed with your
account's signing secret. Check the signature against the **raw** body:

```js
import express from 'express';
import { constructPostback, PostbackSignatureError } from 'ballotdata';

const app = express();
app.post('/ballotdata', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const postback = await constructPostback(req.body, req.get('BallotData-Signature'), process.env.BALLOTDATA_SIGNING_SECRET);
    for (const change of postback.changes) await handle(change); // change.id drops repeats
    res.sendStatus(204);
  } catch (err) {
    if (err instanceof PostbackSignatureError) return res.sendStatus(401);
    throw err;
  }
});
```

`verifyPostbackSignature(rawBody, header, secret)` resolves true or false instead of throwing.
`signPostback(rawBody, secret)` makes a header for testing your endpoint. See the
[postbacks guide](docs/postbacks.md) for Next.js, Cloudflare Workers and plain Node.

## Errors

Every error the API answers with is an `ApiError` with `status`, `code` (such as `outside_purchase`),
`message` and `requestId`. Subclasses let you catch by kind:

| Class | Status | When |
| --- | --- | --- |
| `BadRequestError` | 400 | A parameter isn't valid. |
| `AuthenticationError` | 401 | No key, or a bad, revoked or expired one. |
| `PermissionDeniedError` | 403 | Missing scope, IP allowlist, account not active, or data you haven't bought. |
| `NotFoundError` | 404 | No such contest, endorser, officeholder or subscription. |
| `ConflictError` | 409 | A subscription with that name exists. |
| `CursorExpiredError` | 410 | The stream position is too old. |
| `RateLimitError` | 429 | Over a rate limit, or too many open streams. Has `retryAfter`. |
| `InternalServerError` | 5xx | A problem at BallotData. |
| `ConnectionError` | | The API couldn't be reached. |
| `TimeoutError` | | No answer within `timeout`. |

```js
import { ApiError, NotFoundError } from 'ballotdata';

try {
  await client.contests.get(id);
} catch (err) {
  if (err instanceof NotFoundError) return null;
  if (err instanceof ApiError) console.error(err.code, err.message, err.requestId);
  throw err;
}
```

Quote the `requestId` when you write to [sales@ballotdata.net](mailto:sales@ballotdata.net). Every
code is listed in [docs/errors.md](docs/errors.md).

## Retries, timeouts and cancelling

The client retries, up to `maxRetries` times (default 2):

- 429 and 503 on any request, after the `Retry-After` the API sends (when it's a minute or less: a
  daily limit isn't worth waiting out).
- Network errors and timeouts, and 500, 502 and 504, on GET, PUT and DELETE. A POST that may have
  reached the API isn't repeated.

```js
// Per request
await client.endorsements.list({ states: 'CA' }, { timeout: 60_000, maxRetries: 5 });

// Cancel
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
await client.contests.list({ states: 'CA' }, { signal: controller.signal });
```

## Rate limits

Your plan sets requests per minute (and per day on some plans). The latest headers are on
`client.lastResponse.rateLimit` (`limit`, `remaining`, `reset`, `dailyLimit`, `dailyRemaining`), and
`onResponse` sees every response:

```js
const client = new BallotData({
  onResponse: ({ rateLimit }) => {
    if (rateLimit.remaining !== null && rateLimit.remaining < 5) console.warn('Nearly out of requests this minute');
  },
});
```

## TypeScript

Types ship with the package: every response object (`Contest`, `Endorsement`, `EndorsementEvent`,
…), every parameter object (`ListEndorsementsParams`, `StreamParams`, …) and every enum
(`VoteMethod`, `Level`, `ErrorCode`, …). Fields keep the API's snake_case names, so the API
reference reads the same as your code.

```ts
import { BallotData, type Contest, type EndorsementEvent } from 'ballotdata';
```

Plain JavaScript users get the same types as autocomplete and inline docs in editors such as VS Code.

## Runtimes

The package has no dependencies and uses only web-standard APIs (`fetch`, `ReadableStream`,
`TextDecoder`, Web Crypto), so it runs on Node 20 or newer, Deno, Bun, and edge runtimes such as
Cloudflare Workers and Vercel Edge. It is published as both ES modules and CommonJS.

## More documentation

- [Reference](docs/reference.md): every method, parameter and type.
- [Stream guide](docs/stream.md): syncing, cursors, reconnecting, serverless.
- [Postbacks guide](docs/postbacks.md): receiving signed changes.
- [Errors](docs/errors.md): every error class and code.
- [API docs](https://api.ballotdata.net/docs) and the [API reference](https://api.ballotdata.net/docs/reference).
- `npm run docs` builds HTML docs of the whole package from its doc comments, into `docs/api`.

## License

MIT. Copyright BallotData LLC.
