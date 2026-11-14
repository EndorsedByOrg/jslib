import type { PagePromise, RequestOptions } from '../core.js';
import type { ListOfficesParams, ListOfficeTermsParams, OfficeDetail, OfficeRecord, OfficeTerm } from '../types.js';
import { Resource, seg } from './resource.js';

/**
 * `GET /v1/offices` and `GET /v1/offices/{slug}`: seats that last across
 * elections and redistricting, who held each since 2020, and whether each
 * result changed hands (API 1.9.0).
 */
export class OfficesResource extends Resource {
  /**
   * Seats with their district versions and current holders. Filter by state,
   * level, office type, district (any version) or name.
   *
   * Paged: limit 1–500, default 100.
   *
   * @throws {InternalServerError} 503 `not_available` (after retries) when office data isn't loaded yet.
   * @example
   * const { data } = await client.offices.list({ states: 'CA', office_types: 'us_representative' });
   */
  list(params: ListOfficesParams = {}, options?: RequestOptions): PagePromise<OfficeRecord> {
    return this.transport.list<OfficeRecord>('/v1/offices', { ...params }, options);
  }

  /**
   * One seat with every term and every contest for it, each with its seat change.
   *
   * @throws {NotFoundError} when no office has that slug.
   * @example
   * const seat = await client.offices.get('us-house-ca-12');
   * for (const c of seat.contests) console.log(c.election, c.seat_change?.outcome, c.seat_change?.flipped);
   */
  async get(slug: string, options?: RequestOptions): Promise<OfficeDetail> {
    const res = await this.transport.request<{ data: OfficeDetail }>({ method: 'GET', path: `/v1/offices/${seg(slug)}`, options });
    return res.data;
  }
}

/** `GET /v1/office-terms`: who held which seat, from when to when, since 2020 (API 1.9.0). */
export class OfficeTermsResource extends Resource {
  /**
   * Terms in office. `on` lists who held office that day; `person` lists one
   * person's terms.
   *
   * Paged: limit 1–500, default 100.
   *
   * @example
   * const { data } = await client.officeTerms.list({ states: 'CA', on: '2021-06-01' });
   */
  list(params: ListOfficeTermsParams = {}, options?: RequestOptions): PagePromise<OfficeTerm> {
    return this.transport.list<OfficeTerm>('/v1/office-terms', { ...params }, options);
  }
}
