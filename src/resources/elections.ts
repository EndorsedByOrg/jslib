import type { PagePromise, RequestOptions } from '../core.js';
import type { ElectionExport, ElectionSummary, ExportElectionParams, ListElectionsParams } from '../types.js';
import { Resource, seg } from './resource.js';

/** `GET /v1/elections` and `GET /v1/elections/{slug}/export`. */
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

  /**
   * A whole election in one response: the election, and every contest your
   * account can read in it with its choices and every endorser's position, in
   * ballot order. With `format: 'csv'`, the CSV text instead: one row per
   * endorsement, each repeating its election, contest, district, choice and
   * endorser.
   *
   * @throws {NotFoundError} when no election has that slug.
   * @throws {PermissionDeniedError} (`outside_purchase`) when your account bought none of it.
   * @example
   * const { election, contests } = await client.elections.export('ca-2026-11-03-general');
   * const csv = await client.elections.export('ca-2026-11-03-general', { format: 'csv' });
   */
  export(slug: string, params: ExportElectionParams & { format: 'csv' }, options?: RequestOptions): Promise<string>;
  export(slug: string, params?: ExportElectionParams & { format?: 'json' }, options?: RequestOptions): Promise<ElectionExport>;
  async export(slug: string, params: ExportElectionParams = {}, options?: RequestOptions): Promise<ElectionExport | string> {
    const path = `/v1/elections/${seg(slug)}/export`;
    if (params.format === 'csv') {
      return this.transport.request<string>({ method: 'GET', path, query: { ...params }, responseType: 'text', options });
    }
    const res = await this.transport.request<{ data: ElectionExport }>({ method: 'GET', path, query: { ...params }, options });
    return res.data;
  }
}
