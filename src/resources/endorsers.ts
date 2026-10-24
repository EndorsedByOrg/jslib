import type { PagePromise, RequestOptions } from '../core.js';
import type { Endorser, EndorserDetail, LangParams, ListEndorsersParams } from '../types.js';
import { Resource, seg } from './resource.js';

/** `GET /v1/endorsers` and `GET /v1/endorsers/{slug}`. */
export class EndorsersResource extends Resource {
  /**
   * Endorsers by category, home state (or `national`), or the elections
   * they've endorsed in, or search by name with `q`.
   *
   * Paged: limit 1–500, default 100.
   *
   * @example
   * const { data } = await client.endorsers.list({ categories: 'labor', states: 'CA', q: 'labor council' });
   */
  list(params: ListEndorsersParams = {}, options?: RequestOptions): PagePromise<Endorser> {
    return this.transport.list<Endorser>('/v1/endorsers', { ...params }, options);
  }

  /**
   * One endorser, with the elections they've endorsed in (newest first) and
   * how many contests in each.
   *
   * @param slug The endorser's slug, e.g. `"sf-labor-council"`.
   * @throws {NotFoundError} when no endorser has that slug.
   * @example
   * const endorser = await client.endorsers.get('sf-labor-council');
   * console.log(endorser.elections[0]?.name);
   */
  async get(slug: string, params: LangParams = {}, options?: RequestOptions): Promise<EndorserDetail> {
    const res = await this.transport.request<{ data: EndorserDetail }>({
      method: 'GET',
      path: `/v1/endorsers/${seg(slug)}`,
      query: { ...params },
      options,
    });
    return res.data;
  }
}
