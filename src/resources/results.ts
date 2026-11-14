import type { PagePromise, RequestOptions } from '../core.js';
import type { ListResultsParams, Result, SeatChangesParams, SeatChangeSummary } from '../types.js';
import { Resource } from './resource.js';

/** `GET /v1/results`: who won each contest, by how much, and whether the seat changed hands (API 1.10.0). */
export class ResultsResource extends Resource {
  /**
   * One compact row per contest with a result: winners, every choice's votes,
   * the deciding margin, the source and the seat change. `flipped: true` lists
   * seats that changed party; `max_margin_pct` finds close races.
   *
   * Paged: limit 1–200, default 50.
   *
   * @example
   * const { data } = await client.results.list({ years: 2024, offices: 'us_representative', flipped: true });
   * for (const r of data) console.log(r.title, r.winners[0]?.label, r.margin?.pct_points, r.seat_change?.parties_going_in);
   */
  list(params: ListResultsParams = {}, options?: RequestOptions): PagePromise<Result> {
    return this.transport.list<Result>('/v1/results', { ...params }, options);
  }
}

/** `GET /v1/seat-changes`: seat outcomes and each party's gains and losses, counted (API 1.10.0). */
export class SeatChangesResource extends Resource {
  /**
   * Incumbents re-elected and defeated, open seats, flips, and each party's
   * seats held going in, won, gained, lost and net, over decided contests.
   * Takes the filters of `results.list`; `group_by` splits the counts.
   *
   * @throws {InternalServerError} 503 `not_available` (after retries) when office data isn't loaded yet.
   * @example
   * const { totals, groups } = await client.seatChanges.get({ years: 2024, offices: 'us_representative', group_by: 'state' });
   */
  async get(params: SeatChangesParams = {}, options?: RequestOptions): Promise<SeatChangeSummary> {
    const res = await this.transport.request<{ data: SeatChangeSummary }>({ method: 'GET', path: '/v1/seat-changes', query: { ...params }, options });
    return res.data;
  }
}
