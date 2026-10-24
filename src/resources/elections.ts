import type { PagePromise, RequestOptions } from '../core.js';
import type { ElectionSummary, ListElectionsParams } from '../types.js';
import { Resource } from './resource.js';

/** `GET /v1/elections`. */
export class ElectionsResource extends Resource {
  /**
   * Elections, with their voting rules in `details` (all-mail, ranked choice,
   * fusion, runoff dates) and how many contests and endorsements each has.
   * Use an election's `slug` to ask for its contests or endorsements.
   *
   * Paged: limit 1–500, default 100. Await for one page, or iterate with
   * `for await` for every election.
   *
   * @example
   * const { data } = await client.elections.list({ states: 'CA', upcoming: true });
   * const general = data.find((e) => e.type === 'general');
   */
  list(params: ListElectionsParams = {}, options?: RequestOptions): PagePromise<ElectionSummary> {
    return this.transport.list<ElectionSummary>('/v1/elections', { ...params }, options);
  }
}
