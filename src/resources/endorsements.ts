import type { PagePromise, RequestOptions } from '../core.js';
import type { Endorsement, EndorsementDetail, GetEndorsementParams, HistoryEntry, ListEndorsementsParams } from '../types.js';
import { Resource, seg } from './resource.js';

/** `GET /v1/endorsements`, `GET /v1/endorsements/{id}` and `GET /v1/endorsements/{id}/history`. */
export class EndorsementsResource extends Resource {
  /**
   * Endorsements, one per endorser and choice, with the basics of each: the
   * endorser, contest, election and choice it's for, and the rank. A
   * ranked-choice endorsement of three candidates is three rows with ranks 1–3.
   * {@link EndorsementsResource.get} has the full record, and
   * `client.contests.get()` every position in a contest.
   *
   * This is the way to sync everything; `changed_since` lists only what was
   * added or changed since a time (`client.changes.list()` has deletions too).
   * Paged: limit 1–500, default 100; use 500 to sync with fewer requests.
   *
   * @example
   * for await (const e of client.endorsements.list({ states: 'CA', categories: 'labor', limit: 500 })) {
   *   await db.upsert(e);
   * }
   */
  list(params: ListEndorsementsParams = {}, options?: RequestOptions): PagePromise<Endorsement> {
    return this.transport.list<Endorsement>('/v1/endorsements', { ...params }, options);
  }

  /**
   * One endorsement in full: what the endorser said and where, the endorser,
   * the contest with its district, election and voting rules, and the choice
   * with its candidate and party.
   *
   * @throws {NotFoundError} when no endorsement has that id.
   * @throws {PermissionDeniedError} (`outside_purchase`) when your account didn't buy its contest.
   * @example
   * const e = await client.endorsements.get(90211);
   * console.log(e.endorser.name, e.choice.label, e.statement, e.source_url);
   */
  async get(id: number, params: GetEndorsementParams = {}, options?: RequestOptions): Promise<EndorsementDetail> {
    const res = await this.transport.request<{ data: EndorsementDetail }>({
      method: 'GET',
      path: `/v1/endorsements/${seg(id)}`,
      query: { ...params },
      options,
    });
    return res.data;
  }

  /**
   * Every change to one endorsement, oldest first, with the values before and
   * after, including its deletion. Works after an endorsement is deleted, so
   * you can tell why an id stopped appearing.
   *
   * @throws {NotFoundError} when no endorsement has ever had that id.
   * @example
   * const history = await client.endorsements.history(90211);
   * const last = history.at(-1);
   */
  async history(id: number, options?: RequestOptions): Promise<HistoryEntry[]> {
    const res = await this.transport.request<{ data: HistoryEntry[] }>({
      method: 'GET',
      path: `/v1/endorsements/${seg(id)}/history`,
      options,
    });
    return res.data;
  }
}
