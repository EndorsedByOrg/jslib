/**
 * Small helpers for working with ballot data.
 *
 * @module
 */

import type { ContestBase, Endorsement, EndorserRef, Pick } from './types.js';

/**
 * Group endorsement rows (from `client.endorsements.list()`) by contest and
 * endorser, the shape `client.contests.get()` returns: one position per
 * endorser, with its picks ranked first-to-last for ranked choice.
 *
 * @example
 * const rows = await client.endorsements.list({ endorsers: 'sf-labor-council', elections: slug, limit: 500 }).toArray();
 * for (const { contest, positions } of groupByContest(rows)) {
 *   console.log(contest.title, positions[0].picks.map((p) => p.label));
 * }
 */
export function groupByContest(endorsements: Iterable<Endorsement>): { contest: ContestBase; positions: { endorser: EndorserRef; picks: Pick[] }[] }[] {
  const contests = new Map<number, { contest: ContestBase; byEndorser: Map<number, { endorser: EndorserRef; picks: Pick[] }> }>();
  for (const e of endorsements) {
    let entry = contests.get(e.contest.id);
    if (!entry) contests.set(e.contest.id, (entry = { contest: e.contest, byEndorser: new Map() }));
    let position = entry.byEndorser.get(e.endorser.id);
    if (!position) entry.byEndorser.set(e.endorser.id, (position = { endorser: e.endorser, picks: [] }));
    position.picks.push({
      choice_id: e.choice.id,
      label: e.choice.label,
      measure_answer: e.choice.measure_answer,
      rank: e.rank,
      statement: e.statement,
      source_url: e.source_url,
      published_on: e.published_on,
    });
  }
  return [...contests.values()].map(({ contest, byEndorser }) => ({
    contest,
    positions: [...byEndorser.values()].map((p) => ({ ...p, picks: sortPicks(p.picks) })),
  }));
}

/** Picks in ballot-marking order: by rank for ranked choice, otherwise as given. */
export function sortPicks<T extends { rank: number | null }>(picks: readonly T[]): T[] {
  return [...picks].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
}
