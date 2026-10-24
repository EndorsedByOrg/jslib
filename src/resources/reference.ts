import type { RequestOptions } from '../core.js';
import type { Coverage, CoverageParams, EndorserCategory, LangParams, State } from '../types.js';
import { Resource } from './resource.js';

/** `GET /v1/states`: states, D.C. and territories, with their codes. */
export class StatesResource extends Resource {
  /**
   * Every state, D.C. and territory, with its USPS and FIPS codes. Use the
   * codes in `states` filters.
   *
   * @example
   * const states = await client.states.list();
   * // [{ code: 'AK', fips: '02', name: 'Alaska' }, …]
   */
  async list(options?: RequestOptions): Promise<State[]> {
    const res = await this.transport.request<{ data: State[] }>({ method: 'GET', path: '/v1/states', options });
    return res.data;
  }
}

/** `GET /v1/coverage`: what the API has for each state. */
export class CoverageResource extends Resource {
  /**
   * One row per state: elections, contests, measures, endorsers and
   * endorsements, and when they last changed. Handy for deciding what to sync.
   *
   * @param params.upcoming Count only upcoming elections. Default true.
   * @example
   * for (const row of await client.coverage.list()) {
   *   console.log(row.state, row.endorsement_count, row.updated_at);
   * }
   */
  async list(params: CoverageParams = {}, options?: RequestOptions): Promise<Coverage[]> {
    const res = await this.transport.request<{ data: Coverage[] }>({ method: 'GET', path: '/v1/coverage', query: { ...params }, options });
    return res.data;
  }
}

/** `GET /v1/endorser-categories`: the kinds of endorser. */
export class EndorserCategoriesResource extends Resource {
  /**
   * Every endorser category (labor, editorial, environment, business, party,
   * club, community, officials, …) in display order, with how many endorsers
   * each has. Use the slugs in `categories` filters.
   *
   * @example
   * const categories = await client.endorserCategories.list({ lang: 'es' });
   */
  async list(params: LangParams = {}, options?: RequestOptions): Promise<EndorserCategory[]> {
    const res = await this.transport.request<{ data: EndorserCategory[] }>({
      method: 'GET',
      path: '/v1/endorser-categories',
      query: { ...params },
      options,
    });
    return res.data;
  }
}
