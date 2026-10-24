# Changelog

## 2.0.0 (unreleased)

For BallotData API 1.2.0.

- **Breaking:** `client.endorsements.list()` rows have only the basics: `id`, `rank`, `published_on`,
  `endorser` (`id`, `slug`, `name`), `contest` (`id`, `title`), `election` (`id`, `slug`, `date`) and
  `choice` (`id`, `label`, `measure_answer`). `statement`, `source_url`, the endorser's category and
  state, the contest's district and voting rules, and the choice's candidate and party moved to the
  new detail call. The `EndorsedChoice` type is gone.
- New `client.endorsements.get(id)` (`GET /v1/endorsements/{id}`) returns an `EndorsementDetail`:
  the full record.
- **Breaking:** `groupByContest()` returns `ContestEndorsements` (`{ contest, election, positions }`)
  with the slim contest and endorser. Its picks carry `endorsement_id` instead of `statement` and
  `source_url`.

## 1.0.0

First release.

- `BallotData` client covering every endpoint of the BallotData API v1: states, coverage, elections,
  contests, endorser categories, endorsers, endorsements, officeholders, the stream, events and
  subscriptions.
- Paged lists that can be awaited for a page or iterated for every item.
- Retries with `Retry-After`, timeouts, cancelling, and typed errors.
- `client.stream.connect()`: the Endorsement Stream over Server-Sent Events, with cursors and
  automatic reconnecting.
- `client.events.list()` and `client.events.follow()` for polling.
- `verifyPostbackSignature()`, `constructPostback()` and `signPostback()` for signed postbacks.
- Full TypeScript types. ES modules and CommonJS. No dependencies.
