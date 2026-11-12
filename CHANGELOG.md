# Changelog

## 2.1.0 (unreleased)

For BallotData API 1.4.0.

- BallotData moved to ballotdata.ai: the default API address is now `https://api.ballotdata.ai`.
  The old `https://api.ballotdata.net` keeps answering, so earlier versions keep working.

- New `client.candidates.list()` and `client.candidates.get(id)`: candidates, and every endorsement
  each one received.
- New `client.issues.list()` and `client.issuePositions.list()`: where candidates stand on common
  issues, each position with its sources. `CandidateDetail` has `issue_positions`.
- New `client.changes.list({ since })`: every endorsement added, changed or deleted since a time,
  with the values before and after.
- New `client.endorsements.history(id)`: every change to one endorsement.
- New `client.elections.export(slug, { format })`: a whole election as JSON, or CSV text.
- New fields: `incumbent` and `vote_meaning` on choices; `ballot_text`, `full_text_url` and
  `unopposed` on contests; `added_by` on endorsements and picks, `endorsement_id` on picks;
  `endorsement_count` on `EndorserDetail`. Stream events carry `choice.incumbent`,
  `endorsement.added_by`, and on updates `changed` and `previous`.
- New parameters: `min_endorsements` on `client.endorsers.list()`, `changed_since` on
  `client.endorsements.list()`.
- An endorser's `endorsement_count` now counts contests (a ranked order or slate once).

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
