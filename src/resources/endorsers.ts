import type { PagePromise, RequestOptions } from '../core.js';
import type { Endorser, EndorserDetail, LangParams, ListEndorsersParams, EndorserAgreement, EndorserAgreementParams, EndorserRecord, EndorserRecordParams } from '../types.js';
import { Resource, seg } from './resource.js';

/** `GET /v1/endorsers`, `GET /v1/endorsers/{slug}`, and an endorser's `record` and `agreement`. */
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

  /**
   * An endorser's track record: how the choices they backed did (contests,
   * picks, won, lost, undecided, win rate, average vote share), in total and
   * by contest kind, election stage and election.
   *
   * Only top picks count: a ranked-choice first choice, every candidate of a
   * vote-for-N slate, the Yes or No on a measure. A win rate describes the
   * endorser's picks; it doesn't show the endorsement changed an outcome.
   *
   * @throws {NotFoundError} when no endorser has that slug.
   * @example
   * const record = await client.endorsers.record('sf-labor-council', { stages: 'general' });
   * console.log(record.totals.win_rate, record.by_kind);
   */
  async record(slug: string, params: EndorserRecordParams = {}, options?: RequestOptions): Promise<EndorserRecord> {
    const res = await this.transport.request<{ data: EndorserRecord }>({
      method: 'GET',
      path: `/v1/endorsers/${seg(slug)}/record`,
      query: { ...params },
      options,
    });
    return res.data;
  }

  /**
   * How often other endorsers took the same side as this one, over the
   * contests both took a position in, most contests in common first.
   *
   * @throws {NotFoundError} when no endorser has that slug.
   * @example
   * const { compared } = await client.endorsers.agreement('sf-labor-council', { categories: 'editorial' });
   * for (const c of compared) console.log(c.endorser.name, c.agreement_rate, c.shared_contests);
   */
  async agreement(slug: string, params: EndorserAgreementParams = {}, options?: RequestOptions): Promise<EndorserAgreement> {
    const res = await this.transport.request<{ data: EndorserAgreement }>({
      method: 'GET',
      path: `/v1/endorsers/${seg(slug)}/agreement`,
      query: { ...params },
      options,
    });
    return res.data;
  }
}
