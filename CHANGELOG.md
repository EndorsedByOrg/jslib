# Changelog

## 2.18.0

For BallotData API 1.25.0.

- `fields` on every read: ask for only the fields you need, nested ones included, as a string
  (`'id,title,choices(label,party)'`) or a list of paths. Every method's parameters take it
  (`FieldsParams`, the new `Fields` type), and so do the request options (`RequestOptions.fields`), for
  methods without parameters such as `client.states.list({ fields: 'code,name' })` and
  `client.ballot.lookup(input, { fields })`. See the README's "Choosing fields".

## 2.17.0

For BallotData API 1.24.0.

- `client.candidates.get(id, { outside_spending_cycles })` and `client.endorsers.get(slug, { outside_spending_cycles })`
  (`DetailWithSpendingParams`): show `outside_spending` for only those FEC cycles, such as `2024` or `[2024, 2026]`.
  Outside spending now covers the 2024 cycle as well as 2026.

## 2.16.0

For BallotData API 1.23.0.

- `CandidateDetail.outside_spending` (`CandidateOutsideSpending`, `OutsideSpendingBySpender`): FEC independent
  expenditures and union and corporate communication costs for or against the candidate, per cycle and by
  spender, with first and last dates, naming the spender when it is one of our endorsers.
- `EndorserDetail.outside_spending` (`EndorserOutsideSpending`, `OutsideSpendingByCandidate`): what the
  endorser's FEC committees spent, by candidate. Spending is not an endorsement.

## 2.15.0

For BallotData API 1.22.0.

- `client.search({ q, types, states, limit })` (`GET /v1/search`): the slug or id of anything by name, best match
  first, as `SearchMatch` records: elections (with the nationwide names such as `2026-11-03-general`), contests,
  people and candidate records, endorsers and offices.
- `client.elections.list({ q })`: find elections by words of their name, state, date, month, year or type.

## 2.14.0

For BallotData API 1.21.0.

- `Finance.individual_donors` (`IndividualDonors`, `DonorBucket`, `DonorSizeBand`, `DonorOccupationGroup`):
  what individuals gave a federal candidate in the cycle, from the FEC's file of individual contributions.
  Itemized and unitemized totals, refunds, in-state and out-of-state, and breakdowns by donor size, state,
  occupation group and month. Totals only: no donor names are kept.

## 2.13.0

For BallotData API 1.20.0.

- `CandidateDetail.spending` (`Spending`, `SpendingCategory`): what the candidate's principal campaign
  committee spent money on in each cycle, from its FEC operating expenditures: totals by category
  (advertising, fundraising, consulting, staff, mail and printing, polling…) and the ten businesses and
  organizations it paid most.

## 2.12.0

For BallotData API 1.19.0.

- `client.committeeContributions.list()` (`GET /v1/committee-contributions`, `CommitteeContribution`,
  `CommitteeRef`): what PACs, parties and other committees gave federal candidates, one row per
  contribution as filed with the FEC, by candidate, committee, endorser, type, cycle, state or amount.
  Ids are strings (the FEC's 19-digit row id).
- `CandidateDetail.contributions_from_committees` (`CommitteeContributionsReceived`) and
  `EndorserDetail.contributions_to_candidates` (`CommitteeContributionsGiven`): per-cycle totals with the
  ten largest givers or recipients.

## 2.11.0

For BallotData API 1.18.0.

- `EndorserDetail.fec_committees` (`EndorserCommittee`, `FecCommittee`, `CommitteeFinance`): the endorser's
  FEC committees, itself when it is a registered committee (`basis: 'fec_id'`) and PACs it sponsors
  (`basis: 'sponsor'`), each with its receipts, contributions, independent expenditures and cash on hand.
- `CandidateDetail.fec_committees` (`CandidateCommittee`): principal campaign committee, other authorized
  and joint fundraising committees, and leadership PACs the candidate sponsors.
- `Finance` gains `committee_contributions`, `party_contributions`, `candidate_contributions`,
  `candidate_loans`, `other_loans`, `cash_beginning` and `incumbent_challenger`.

## 2.10.0

For BallotData API 1.15.0.

- `PersonPartyChange.after`: every party switch is dated. For a `ballot` switch, `after` is their last
  election under the old party and `on` their first under the new one (a primary counts), so the switch
  happened between them; `after` is `null` when `on` is the day (`announced`).

## 2.9.0

For BallotData API 1.14.0.

- Fusion voting: `Choice.party_lines` (`PartyLine`) lists every party line a candidate is printed on,
  with votes per line where the source splits them.
- `Choice.status` (`ChoiceStatus`): `on_ballot`, `withdrew_still_on_ballot`, `advanced`, `won` or `lost`.
- `Contest.other_candidates` (`Candidacy`, `CandidacyStatus`): people in the race who aren't printed:
  declared, withdrew before printing, disqualified, and write-ins.
- `CandidateSummary.person` (`Person`, `PersonPartyChange`): one person across elections, with other names
  and party switches; `client.candidates.list({ person })` finds all of a person's records.
  `CandidateDetail.other_candidacies` lists races they were in without being printed.
- `rescinded_endorsements` (`RescindedEndorsement`) on `ContestDetail` and on each of a
  `CandidateDetail`'s contests: endorsements the endorser took back.
- README: a section on fusion tickets, withdrawals, write-ins and party switches.

## 2.8.0

For BallotData API 1.13.0.

- Contests (`Contest`, `BallotContest`, `Result`) gain `on_ballot` and `off_ballot_reason`
  (`OffBallotReason`: `unopposed` or `cancelled`). The API now lists races a state or county leaves
  off the printed ballot, usually unopposed ones whose candidates were declared elected.
- `client.contests.list({ on_ballot: true })` and `client.ballot.lookup({ address, on_ballot: true })`
  keep only the contests printed on the ballot.

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
