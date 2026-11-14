# Changelog

## 2.7.0

For BallotData API 1.10.0.

- `client.results.list(params)` (`GET /v1/results`): who won each contest, by how much and whether
  the seat changed hands (`Result`, `ResultChoice`, `ResultMargin`), with filters for years, stages,
  seats, close races (`max_margin_pct`) and seat changes (`flipped`, `seat_outcomes`, `flipped_to`,
  `flipped_from`).
- `client.seatChanges.get(params)` (`GET /v1/seat-changes`): seat outcomes and each party's seats
  held, won, gained, lost and net, optionally grouped (`SeatChangeSummary`, `SeatChangeCounts`,
  `SeatChangeParty`).

## 2.6.0

For BallotData API 1.11.0.

- `client.ballot.lookup({ address })` (`POST /v1/ballot`): the districts and every contest on the
  ballot at a street address, or at `latitude` and `longitude` (`BallotLookup`, `BallotElection`,
  `BallotContest`, `BallotChoice`, `BallotDistrict`, `BallotLookupInput`). The address goes in the
  request body and is never stored.

## 2.5.0

For BallotData API 1.9.0.

- `client.offices.list()` and `client.offices.get(slug)`: seats that last across elections and
  redistricting (`OfficeRecord`, `OfficeDetail`, `OfficeDistrict`, `CurrentHolder`), with every
  term and every contest for the seat.
- `client.officeTerms.list()`: who held which seat since 2020 (`OfficeTerm`), with `on`, `since`,
  `person`, `offices` and `hows`.
- `seat` (`ContestSeat`) on contests and `seat_change` (`SeatChange`) on `ContestResult` and
  `ContestResultBrief`: incumbent re-elected, defeated or open seat, and whether a partisan seat
  flipped.
- `client.csv` takes `/v1/offices` and `/v1/office-terms`.
- New value types `OfficeRecordLevel`, `TermHow`, `TermEndReason`, `TermDatesBasis`,
  `TermSourceKind` and `SeatOutcome`.

## 2.4.0

For BallotData API 1.8.0.

- Research data on the records it describes, each value with its source: `District.partisanship`
  (`DistrictPartisanship`, `PresidentialVote`), `District.demographics` (`DistrictDemographics`),
  `ContestResult.turnout` (`Turnout`), `background` (`CandidateBackground`, `BackgroundSource`) and
  `ideology` (`CandidateIdeology`, `IdeologyScore`) on `CandidateSummary` and `CandidateDetail`, and
  `facts` (`EndorserFacts`, `EndorserFactSource`) on `Endorser` and `EndorserDetail`.
- `first_seen_on` and `date_source` (`DateSource`) on `Endorsement`, `EndorsementDetail`, `Pick` and
  `CandidateEndorsement`; `groupByContest` keeps `first_seen_on` on each `EndorsementPick`.
- New value types `PresidentialVoteMethod`, `BackgroundAttribute`, `BackgroundBasis`, `Gender`,
  `IdeologyMeasure` and `EndorserFactKind`.

## 2.3.0

For BallotData API 1.7.0.

- `client.endorsers.record(slug)`: an endorser's track record (`EndorserRecord`, `RecordTally`):
  contests, picks, won, lost, undecided, win rate and average vote share, in total and by contest
  kind, election stage and election.
- `client.endorsers.agreement(slug)`: how often other endorsers took the same side
  (`EndorserAgreement`, `AgreementRow`), with `with`, `categories` and `min_shared`.
- `client.csv`: the lists as CSV (`format=csv`). `csv.page()` gives one page and its cursor,
  `csv.pages()` walks them, and `csv.all()` joins them into one CSV. New types `CsvPage`, `CsvPath`
  and `Query`.

## 2.2.0

For BallotData API 1.6.0.

- Every enum type's doc comment lists each value and what it means, matching the API's new
  [Field values](https://api.ballotdata.ai/docs/values) page. New named types for values that were
  inline: `OfficeLevel`, `OfficeBranch`, `OfficeholderLevel` and `ContactSourceKind`.
- `PrimarySystem` has `top_four` (Alaska), which the API already returned, and
  `ElectionDetails.consolidated_with` can be a list of names.

- Election results: `Contest.result` (`ContestResult`: status, `source_kind` official / compiled /
  party, `party_reported`, totals, the source and its URL, ranked-choice rounds, write-ins) and
  `Choice.result` (`ChoiceResult`: `votes`, `vote_pct`, `winner`), null until a source has a result.
  `CandidateContest` has `result` and `choice.result`; `ElectionSummary` has `result_count`;
  `ElectionDetails` has `historical` for past elections such as November 5, 2024.
- New parameters: `has_result` and `result_statuses` on `client.contests.list()`.
- What other election-data providers' files carry:
  - Contests: `office` (`ContestOffice`: a normalized `type` such as `us_representative`, `mayor` or
    `school_board`, with `level` and `branch`), `race_type` (regular, special, recall, retention),
    `partisan`, and `topics` on measures. New `offices` and `topics` parameters on
    `client.contests.list()`, and `client.measureTopics.list()`.
  - Candidates: `name` (`NameParts`), `ids` (FEC and bioguide), `contact` (website, email, phone,
    mailing address and social accounts, each with its source), and `finance` (FEC totals) on
    `client.candidates.get(id)`.
  - `endorsement_count` on every choice, and `stage` (general, primary, runoff) on endorsements and picks.

## 2.1.0

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
