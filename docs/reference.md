# Reference

Every class, method, parameter and type in `ballotdata`. For a tour, start with the
[README](../README.md).

- [`new BallotData(options)`](#new-ballotdataoptions)
- [Request options](#request-options)
- [`PagePromise`](#pagepromise)
- [states](#clientstates) · [coverage](#clientcoverage) · [elections](#clientelections) ·
  [contests](#clientcontests) · [endorserCategories](#clientendorsercategories) ·
  [endorsers](#clientendorsers) · [csv](#clientcsv) · [endorsements](#clientendorsements) ·
  [officeholders](#clientofficeholders) · [offices](#clientoffices) · [officeTerms](#clientofficeterms) · [results](#clientresults) · [seatChanges](#clientseatchanges) · [stream](#clientstream) · [events](#clientevents) ·
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
| `baseUrl` | `string` | `process.env.BALLOTDATA_API_URL`, then `https://api.ballotdata.ai` | |
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

### `elections.export(slug, params?, options?)` → `Promise<ElectionExport>` or `Promise<string>`

`GET /v1/elections/{slug}/export`. A whole election: the `election`, and every contest you can read
in it with its choices and every endorser's position, in ballot order. With `format: 'csv'`, the CSV
text instead, one row per endorsement. Throws `NotFoundError`, or `PermissionDeniedError`
(`outside_purchase`) when your account bought none of it.

| Parameter | Type | |
| --- | --- | --- |
| `format` | `'json' \| 'csv'` | Default `json`. |
| `lang` | `'en' \| 'es'` | |

## `client.contests`

### `contests.list(params?, options?)` → `PagePromise<Contest>`

`GET /v1/contests`. The races on the ballot, each with its district, election, voting rules and every
choice in ballot order. Each `district` has `partisanship` (the 2020 and 2024 presidential vote in it)
and `demographics` (Census ACS estimates), and a `result` has `turnout` (registered voters and ballots
cast in the jurisdiction), where an official source covers the area; see
[Research data](#research-data).

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

## `client.ballot`

### `ballot.lookup(input, options?)` → `Promise<BallotLookup>`

`POST /v1/ballot`. The districts a street address is in, on today's lines, and every contest on its
ballot, by election and in ballot order (`elections`, each `{ election, contests,
contests_outside_purchase }`). The address goes in the request body, is found with the U.S. Census
Bureau's geocoder and is never stored. Throws `NotFoundError` (`address_not_found`) when the address
isn't found, and `BadRequestError` for a ZIP code, city or state alone.

| Field | Type | |
| --- | --- | --- |
| `address` | `string` | A street address with a house number, with the city and state or ZIP code. |
| `latitude`, `longitude` | `number` | A point, instead of an address. |
| `elections` | `string[]` | Only these elections (slugs). Default: every election from 60 days ago on. |
| `party` | `string` | In a partisan primary, only this party's contests (and the nonpartisan ones). |
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
| `min_endorsements` | `number` | Only endorsers with at least this many contests. 5 matches endorsedby.org's default list. |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

### `endorsers.get(slug, params?, options?)` → `Promise<EndorserDetail>`

`GET /v1/endorsers/{slug}`. One endorser with the elections they've endorsed in, newest first.
Throws `NotFoundError`.

| Parameter | Type |
| --- | --- |
| `lang` | `'en' \| 'es'` |

### `endorsers.record(slug, params?, options?)` → `Promise<EndorserRecord>`

`GET /v1/endorsers/{slug}/record`. How the choices an endorser backed did: `totals`, `by_kind`,
`by_stage` and `elections` (newest first), each with `contests`, `picks`, `won`, `lost`, `undecided`,
`win_rate`, `avg_vote_pct`, `incumbent_picks`, `incumbent_won`, `non_incumbent_picks` and
`non_incumbent_won`. Only top picks count (a ranked-choice first choice, every candidate of a
vote-for-N slate, the Yes or No on a measure). A win rate describes the endorser's picks; it doesn't
show an endorsement changed an outcome. Throws `NotFoundError`.

| Parameter | Type | |
| --- | --- | --- |
| `elections` | `ListParam` | Election slugs. |
| `states` | `ListParam` | States the contests are voted in. |
| `contest_kinds` | `ListParam` | `candidate`, `measure`, `retention`. |
| `stages` | `ListParam` | `primary`, `general`, `runoff`. |
| `lang` | `'en' \| 'es'` | |

### `endorsers.agreement(slug, params?, options?)` → `Promise<EndorserAgreement>`

`GET /v1/endorsers/{slug}/agreement`. How often other endorsers took the same side, over the contests
both took a position in: `contests` (this endorser's) and `compared`, each with its `endorser`,
`shared_contests`, `agreed`, `partly_agreed`, `disagreed` and `agreement_rate`, most contests in
common first. Throws `NotFoundError`.

| Parameter | Type | |
| --- | --- | --- |
| `with` | `ListParam` | Compare with only these endorsers (slugs). |
| `categories` | `ListParam` | Compare with only endorsers in these categories. |
| `elections`, `states`, `contest_kinds`, `stages` | `ListParam` | Which contests count, as for `record`. |
| `min_shared` | `number` | Leave out endorsers with fewer contests in common. Default 3. |
| `limit` | `number` | 1–100, default 25. |
| `lang` | `'en' \| 'es'` | |

## `client.endorsements`

### `endorsements.list(params?, options?)` → `PagePromise<Endorsement>`

`GET /v1/endorsements`. One row per endorser and choice, with the basics of each: `id`, `rank`,
`published_on`, `endorser` (`id`, `slug`, `name`), `contest` (`id`, `title`), `election` (`id`,
`slug`, `date`) and `choice` (`id`, `label`, `measure_answer`). A ranked-choice endorsement of three
candidates is three rows with ranks 1–3. `endorsements.get(id)` has the full record.

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
| `changed_since` | `string \| Date` | Only endorsements added or changed at or after this time. |
| `upcoming` | `boolean` | |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

### `endorsements.get(id, { lang }?, options?)` → `Promise<EndorsementDetail>`

`GET /v1/endorsements/{id}`. One endorsement in full: `statement`, `source_url`, `published_on`,
`retrieved_at`, the `endorser` (with `category`, `description`, `website_url`, `logo_url`, `state`
and `party`), the `contest` (a `ContestBase`, with its district, election and voting rules) and the
`choice` (a `Choice`, with its candidate and party). Throws `NotFoundError`, or
`PermissionDeniedError` (`outside_purchase`) when your account didn't buy its contest.

### `endorsements.history(id, options?)` → `Promise<HistoryEntry[]>`

`GET /v1/endorsements/{id}/history`. Every change to one endorsement, oldest first: `at`, `change`
(`created`, `updated` or `deleted`), `changed` (the fields an update changed), and `before` and
`after` values. Works after the endorsement is deleted. Throws `NotFoundError`.

## `client.changes`

### `changes.list(params?, options?)` → `PagePromise<Change>`

`GET /v1/changes`. Every endorsement added, changed or deleted since a time, oldest first, with the
values before and after. Keep the last page's `next_cursor` and pass it next time.

| Parameter | Type | |
| --- | --- | --- |
| `since` | `string \| Date` | Changes at or after this time. Required unless you pass a cursor. |
| `categories` | `ListParam` | Endorser categories. |
| `endorsers` | `ListParam` | Endorser slugs. |
| `elections` | `ListParam` | Election slugs. |
| `states` | `ListParam<StateCode>` | States the contests are voted in. |
| `limit` | `number` | 1–1000, default 100. |
| `cursor` | `string` | |

## `client.candidates`

### `candidates.list(params?, options?)` → `PagePromise<CandidateSummary>`

`GET /v1/candidates`. Candidates, each with the contests they're on and how many endorsers backed
them in each.

| Parameter | Type | |
| --- | --- | --- |
| `q` | `string` | Name contains (case-insensitive, up to 100 characters). |
| `states` | `ListParam<StateCode>` | States the contests are voted in. |
| `elections` | `ListParam` | Election slugs. |
| `incumbent` | `boolean` | `true` for only incumbents, `false` for only candidates known not to hold the seat. |
| `upcoming` | `boolean` | |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

### `candidates.get(id, { lang }?, options?)` → `Promise<CandidateDetail>`

`GET /v1/candidates/{id}`. One candidate with every contest they're on and every endorsement they
received in each, `issue_positions`: where they stand on common issues, each with its sources, and
(like every candidate in `candidates.list`) `background` (prior elected office, gender, military
service) and `ideology` (DIME CFscore); see [Research data](#research-data).
Throws `NotFoundError`, or `PermissionDeniedError` (`outside_purchase`).

## `client.issues`

### `issues.list(options?)` → `Promise<Issue[]>`

`GET /v1/issues`. The policy issues candidates' positions are recorded on, in display order. Each
has a yes/no `question`; a position's `stance` answers it (`supports`, `opposes`, `mixed`, or null
for a stated position that doesn't answer it either way).

## `client.issuePositions`

### `issuePositions.list(params?, options?)` → `PagePromise<IssuePositionItem>`

`GET /v1/issue-positions`. Where candidates stand, one row per candidate and issue: a neutral
`summary`, the candidate's own words (`quote`) where there are any, and `sources` (their site,
debates, questionnaires, news, or official roll-call votes for members of Congress). Each row names
its `candidate` and the `contests` they're on that you can read.

| Parameter | Type | |
| --- | --- | --- |
| `issues` | `ListParam` | Issue slugs. |
| `stances` | `ListParam<IssueStance>` | `supports`, `opposes`, `mixed`. |
| `candidates` | `number \| number[]` | Candidate ids. |
| `contests` | `number \| number[]` | Contest ids: positions of the candidates on these contests. |
| `elections` | `ListParam` | Election slugs. |
| `states` | `ListParam<StateCode>` | States the contests are voted in. |
| `limit` | `number` | 1–1000, default 100. |
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

## `client.offices`

API 1.9.0. Seats that last across elections and redistricting (`us-house-ca-12`, `oh-governor`, a
numbered council position, an at-large board), who held each since 2020, and whether each result
changed hands.

### `offices.list(params?, options?)` → `PagePromise<OfficeRecord>`

`GET /v1/offices`. Each seat with its district versions (`districts`, plan-2020 lines first) and
`current_holders`.

| Parameter | Type | |
| --- | --- | --- |
| `states` | `ListParam<StateCode>` | |
| `levels` | `ListParam<OfficeRecordLevel>` | `federal`, `state`, `local`. |
| `office_types` | `ListParam<ContestOfficeType>` | |
| `districts` | `ListParam` | OCD ids: seats elected on any of them, under any plan. |
| `q` | `string` | Name contains. |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

### `offices.get(slug, options?)` → `Promise<OfficeDetail>`

`GET /v1/offices/{slug}`. One seat with every term (`terms`) and every contest (`contests`), each
with its `seat_change`. Throws `NotFoundError`.

## `client.officeTerms`

### `officeTerms.list(params?, options?)` → `PagePromise<OfficeTerm>`

`GET /v1/office-terms`. Terms in office since 2020: who, which seat, from when to when, how they got
it (`how`: elected, special_election, appointed, succeeded, retained, holdover) and how it ended
(`end_reason`).

| Parameter | Type | |
| --- | --- | --- |
| `states`, `levels`, `office_types` | | As on `offices.list`. |
| `offices` | `ListParam` | Office slugs. |
| `on` | `DateString` | Who held office that day. |
| `since` | `DateString` | Terms that ended on or after this day, or are still going. |
| `person` | `string` | One person's terms, by `person_key`. |
| `hows` | `ListParam<TermHow>` | |
| `q` | `string` | Holder's name contains. |
| `limit` | `number` | 1–500, default 100. |
| `cursor` | `string` | |

### Seat flips

Every decided contest linked to its seat has `result.seat_change` (`SeatChange`): `outcome`
(`incumbent_reelected`, `incumbent_defeated`, `open_seat`, `new_seat`, `unknown`; for a body
`incumbents_reelected` or `mixed`) and, for a partisan seat, `flipped`, judged against whoever held
the seat going in, so appointments and party switches count. Contests carry `seat` (`ContestSeat`).

```ts
const seat = await client.offices.get('us-house-ca-12');
for (const c of seat.contests) {
  if (c.seat_change) console.log(c.election_date, c.seat_change.outcome, c.seat_change.flipped);
}
const { data: inOffice } = await client.officeTerms.list({ states: 'CA', on: '2021-06-01' });
```

## `client.results`

### `results.list(params?, options?)` → `PagePromise<Result>`

`GET /v1/results` (API 1.10.0). One compact row per contest with a result: `winners`, every
choice's votes (`choices`, most votes first), the deciding `margin` (votes and percentage points
between the last winning place and the next), `status`, `source_kind`, `source` and `seat_change`.

| Parameter | Type | |
| --- | --- | --- |
| `elections`, `states`, `levels`, `contest_kinds`, `districts` | | As on `contests.list`. |
| `years` | `number \| string \| (number \| string)[]` | Election years. |
| `stages` | `ListParam<ElectionStage>` | general, primary or runoff. |
| `offices` | `ListParam<ContestOfficeType>` | Office types. |
| `seats` | `ListParam` | Office slugs. |
| `result_statuses` | `ListParam<ResultStatus>` | |
| `source_kinds` | `ListParam<ResultSourceKind>` | official, compiled or party. |
| `decided` | `boolean` | Only results that name a winner (or, false, that don't yet). |
| `max_margin_pct` | `number` | Close races: margin at most this many points. |
| `flipped` | `boolean` | Only seats that changed party (or, false, partisan seats that didn't). |
| `seat_outcomes` | `ListParam<SeatOutcome>` | |
| `flipped_to`, `flipped_from` | `ListParam` | Party slugs: one party's gains or losses. |
| `q` | `string` | Contest title contains. |
| `lang` | `'en' \| 'es'` | |
| `limit` | `number` | 1–200, default 50. |
| `cursor` | `string` | |

```ts
const { data: flips } = await client.results.list({ years: 2024, offices: 'us_representative', flipped: true });
for (const r of flips) console.log(r.title, r.winners[0]?.label, r.margin?.pct_points, r.seat_change?.parties_going_in);
```

## `client.seatChanges`

### `seatChanges.get(params?, options?)` → `Promise<SeatChangeSummary>`

`GET /v1/seat-changes` (API 1.10.0). Seat outcomes over decided contests: incumbents re-elected
and defeated, open seats, flips, and each party's seats `held_going_in`, `won`, `gained`, `lost` and
`net`. Takes the filters of `results.list` (not `decided`, `max_margin_pct`, `lang` or paging) plus
`group_by` (`state`, `office_type`, `election` or `stage`). Counts are contests, so a vote-for-N
contest counts once for each party in it.

```ts
const { totals, groups } = await client.seatChanges.get({ years: 2024, offices: 'us_representative', group_by: 'state' });
```

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
| `groupByContest(endorsements)` | Groups `Endorsement` rows into `ContestEndorsements`: `{ contest, election, positions: [{ endorser, picks }] }`, picks ranked first-to-last, each with its `endorsement_id`. |
| `sortPicks(picks)` | Picks sorted by `rank` (unranked last, in their order). |
| `parseSse(body)` | The SSE parser the stream uses: an async iterator of `{ event, data, id?, retry? }` from a byte stream. |
| `encodeQuery(query)` | `URLSearchParams` the way the API wants them: lists joined with commas, booleans as `true`/`false`, dates as ISO. |
| `VERSION` | This library's version. |
| `DEFAULT_BASE_URL` | `'https://api.ballotdata.ai'`. |

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
| `Endorsement`, `EndorsementDetail`, `EndorsementEndorser` | Endorsements. |
| `ContestEndorsements`, `EndorsementPosition`, `EndorsementPick` | From `groupByContest`. |
| `Officeholder`, `OfficeholderDetail` | Officeholders. |
| `OfficeRecord`, `OfficeDetail`, `OfficeDistrict`, `CurrentHolder`, `OfficeTerm`, `ContestSeat`, `SeatChange` | Offices, terms and seat flips (API 1.9.0). |
| `DistrictPartisanship`, `PresidentialVote`, `DistrictDemographics`, `Turnout`, `CandidateBackground`, `BackgroundSource`, `CandidateIdeology`, `IdeologyScore`, `EndorserFacts`, `EndorserFactSource`, `ResearchSource` | Research data (API 1.8.0). |
| `EndorsementEvent`, `EventsPage`, `Filter`, `Subscription`, `SubscriptionInput`, `Postback` | Stream. |
| `List…Params`, `GetContestParams`, `StreamParams`, `ListEventsParams`, `CoverageParams`, `LangParams`, `PageParams` | Parameters. |
| `VoteMethod`, `ContestKind`, `Level`, `ElectionType`, `PrimarySystem`, `MeasureAnswer`, `EndorsementStage`, `RaceType`, `ContestOfficeType`, `OfficeLevel`, `OfficeBranch`, `MeasureTopicSlug`, `ResultStatus`, `ResultSourceKind`, `AddedBy`, `DateSource`, `PresidentialVoteMethod`, `BackgroundAttribute`, `BackgroundBasis`, `Gender`, `IdeologyMeasure`, `EndorserFactKind`, `HistoryField`, `IssueStance`, `IssuePositionSourceKind`, `ContactSourceKind`, `Office`, `OfficeholderLevel`, `OfficeRecordLevel`, `TermHow`, `TermEndReason`, `TermDatesBasis`, `TermSourceKind`, `SeatOutcome`, `EventType`, `ChangeType`, `ErrorCode`, `Lang` | Enums. Each one's doc comment lists every value and what it means, as on the API's [Field values](https://api.ballotdata.ai/docs/values) page. |
| `ClientOptions`, `RequestOptions`, `Page`, `ResponseInfo`, `RateLimit`, `StreamOptions`, `StreamMessage`, `FollowOptions` | Client. |

Each field is documented in the type definitions (`dist/*/types.d.ts`), which editors show as you
type. `npm run docs` builds browsable HTML of all of it.

## Research data

API 1.8.0 adds the variables studies of endorsements control for to the records they describe, each
value with its source. A `null` means none is recorded, never zero or no.

| Field | Type | What |
| --- | --- | --- |
| `contest.district.partisanship` | `DistrictPartisanship` | The presidential vote in the district, 2020 and 2024, with `dem_two_party_pct`. FEC, MIT Election Data and Science Lab (CC0) and California Secretary of State counts. |
| `contest.district.demographics` | `DistrictDemographics \| null` | American Community Survey 2020-2024 estimates. U.S. Census Bureau data; not endorsed by the Census Bureau. |
| `contest.result.turnout` | `Turnout \| null` | Registered voters and ballots cast in the jurisdiction. EAC survey 2020-2024, state offices for 2026. |
| `first_seen_on`, `date_source` on endorsements and picks | `DateString \| null`, `DateSource \| null` | The earliest date the endorsement can be shown to have been public. |
| `candidate.background` | `CandidateBackground` | Prior elected office, gender, military service, only as a source states them. Race, ethnicity, religion and sexual orientation are not collected. |
| `candidate.ideology` | `CandidateIdeology` | DIME CFscores. Cite: Bonica, Adam. 2024. Database on Ideology, Money in Politics, and Elections: Public version 4.0. Stanford University Libraries. https://data.stanford.edu/dime (ODC-BY 1.0). |
| `endorser.facts` | `EndorserFacts` | FEC committee ids, IRS employer id and tax-exemption section, Department of Labor file number and union membership, founding year, parent organization. |

```ts
const contest = await client.contests.get(4410);
const lean = contest.district.partisanship.president_2024?.dem_two_party_pct; // null if no official count
const candidate = await client.candidates.get(8811);
console.log(candidate.background.prior_offices, candidate.ideology.dime_cfscore);
```

Every field's meaning and source is in the API's
[data dictionaries](https://api.ballotdata.ai/docs/dictionary) and the
[researchers' guide](https://api.ballotdata.ai/docs/research#controls).

## `client.csv`

Lists as CSV (`format=csv`), for spreadsheets, R and pandas. The rows are the same records the list
methods return, paged the same way, and `params` are the matching list method's. The columns of each
CSV are in the [data dictionaries](https://api.ballotdata.ai/docs/dictionary#csv).

`path` is one of `/v1/elections`, `/v1/coverage`, `/v1/contests`, `/v1/endorsers`,
`/v1/endorsements`, `/v1/candidates`, `/v1/issue-positions`, `/v1/officeholders`, `/v1/offices`, `/v1/office-terms`,
`/v1/endorsers/{slug}/record` or `/v1/endorsers/{slug}/agreement`.

### `csv.page(path, params?, options?)` → `Promise<CsvPage>`

One page: `{ text, nextCursor }`. Pass `nextCursor` as `cursor` for the next page; it is `null` on the
last.

### `csv.pages(path, params?, options?)` → `AsyncGenerator<CsvPage>`

Every page, one after another.

### `csv.all(path, params?, options?)` → `Promise<string>`

Every page joined into one CSV with the header once. Each page is a request, so filter by election
or state before reading a long list.

```ts
import { writeFile } from 'node:fs/promises';

const csv = await client.csv.all('/v1/endorsements', { elections: 'ca-2026-11-03-general' });
await writeFile('endorsements.csv', csv);
```
