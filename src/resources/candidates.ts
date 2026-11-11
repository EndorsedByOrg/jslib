import type { PagePromise, RequestOptions } from '../core.js';
import type { CandidateDetail, CandidateSummary, LangParams, ListCandidatesParams } from '../types.js';
import { Resource, seg } from './resource.js';

/** `GET /v1/candidates` and `GET /v1/candidates/{id}`. */
export class CandidatesResource extends Resource {
  /**
   * Candidates, each with the contests they're on and how many endorsers
   * backed them in each. Search by name, or narrow by state, election or
   * incumbency. Paged: limit 1–500, default 100.
   *
   * @example
   * const { data } = await client.candidates.list({ q: 'doe', states: 'CA' });
   */
  list(params: ListCandidatesParams = {}, options?: RequestOptions): PagePromise<CandidateSummary> {
    return this.transport.list<CandidateSummary>('/v1/candidates', { ...params }, options);
  }

  /**
   * One candidate, with every contest they're on and every endorsement they
   * received in each.
   *
   * @throws {NotFoundError} when no candidate has that id.
   * @throws {PermissionDeniedError} (`outside_purchase`) when your account bought none of their contests.
   * @example
   * const c = await client.candidates.get(8811);
   * for (const { contest, endorsements } of c.contests) console.log(contest.title, endorsements.length);
   */
  async get(id: number, params: LangParams = {}, options?: RequestOptions): Promise<CandidateDetail> {
    const res = await this.transport.request<{ data: CandidateDetail }>({
      method: 'GET',
      path: `/v1/candidates/${seg(id)}`,
      query: { ...params },
      options,
    });
    return res.data;
  }
}
