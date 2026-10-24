import type { PagePromise, RequestOptions } from '../core.js';
import type { LangParams, ListOfficeholdersParams, Officeholder, OfficeholderDetail } from '../types.js';
import { Resource, seg } from './resource.js';

/** `GET /v1/officeholders` and `GET /v1/officeholders/{id}`: who holds office now, from Open States. */
export class OfficeholdersResource extends Resource {
  /**
   * People in office now, with party, term and contact details. Filter by
   * state, office, level or seat (OCD id). Covers federal and state offices
   * and the D.C. Council.
   *
   * Paged: limit 1–500, default 100.
   *
   * @throws {InternalServerError} 503 `not_available` (after retries) when officeholder data isn't loaded yet.
   * @example
   * const { data } = await client.officeholders.list({ states: 'CA', offices: 'state_representative' });
   */
  list(params: ListOfficeholdersParams = {}, options?: RequestOptions): PagePromise<Officeholder> {
    return this.transport.list<Officeholder>('/v1/officeholders', { ...params }, options);
  }

  /**
   * One officeholder by `person_id`, with every seat they hold.
   *
   * @throws {NotFoundError} when no officeholder has that id.
   * @example
   * const person = await client.officeholders.get('4f6a2c1e-8b3d-4e5f-9a7b-1c2d3e4f5a6b');
   */
  async get(personId: string, params: LangParams = {}, options?: RequestOptions): Promise<OfficeholderDetail> {
    const res = await this.transport.request<{ data: OfficeholderDetail }>({
      method: 'GET',
      path: `/v1/officeholders/${seg(personId)}`,
      query: { ...params },
      options,
    });
    return res.data;
  }
}
