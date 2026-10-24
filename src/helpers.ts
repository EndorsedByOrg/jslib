/**
 * Small helpers for working with ballot data.
 *
 * @module
 */

import type { DateString, Endorsement, MeasureAnswer } from './types.js';

/** One choice an endorser picked, from {@link groupByContest}. */
export interface EndorsementPick {
  /** The endorsement row: `client.endorsements.get(id)` has its statement and source. */
  endorsement_id: number;
  choice_id: number;
  label: string;
  measure_answer: MeasureAnswer | null;
  /** Ranked choice: 1 for first choice, 2 for second, …; null otherwise. */
  rank: number | null;
  published_on: DateString | null;
}

/** One endorser's picks in a contest, from {@link groupByContest}. */
export interface EndorsementPosition {
  endorser: Endorsement['endorser'];
  picks: EndorsementPick[];
}

/** A contest and every endorser's position in it, from {@link groupByContest}. */
export interface ContestEndorsements {
  contest: Endorsement['contest'];
  election: Endorsement['election'];
  positions: EndorsementPosition[];
}

/**
 * Group endorsement rows (from `client.endorsements.list()`) by contest and
 * endorser: one position per endorser, with its picks ranked first-to-last for
 * ranked choice, like the positions `client.contests.get()` returns.
 *
 * @example
 * const rows = await client.endorsements.list({ endorsers: 'sf-labor-council', elections: slug, limit: 500 }).toArray();
 * for (const { contest, positions } of groupByContest(rows)) {
 *   console.log(contest.title, positions[0].picks.map((p) => p.label));
 * }
 */
export function groupByContest(endorsements: Iterable<Endorsement>): ContestEndorsements[] {
  const contests = new Map<number, { contest: Endorsement['contest']; election: Endorsement['election']; byEndorser: Map<number, EndorsementPosition> }>();
  for (const e of endorsements) {
    let entry = contests.get(e.contest.id);
    if (!entry) contests.set(e.contest.id, (entry = { contest: e.contest, election: e.election, byEndorser: new Map() }));
    let position = entry.byEndorser.get(e.endorser.id);
    if (!position) entry.byEndorser.set(e.endorser.id, (position = { endorser: e.endorser, picks: [] }));
    position.picks.push({
      endorsement_id: e.id,
      choice_id: e.choice.id,
      label: e.choice.label,
      measure_answer: e.choice.measure_answer,
      rank: e.rank,
      published_on: e.published_on,
    });
  }
  return [...contests.values()].map(({ contest, election, byEndorser }) => ({
    contest,
    election,
    positions: [...byEndorser.values()].map((p) => ({ ...p, picks: sortPicks(p.picks) })),
  }));
}

/** Picks in ballot-marking order: by rank for ranked choice, otherwise as given. */
export function sortPicks<T extends { rank: number | null }>(picks: readonly T[]): T[] {
  return [...picks].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}
