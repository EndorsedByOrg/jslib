import type { CsvPage, Query, RequestOptions } from '../core.js';
import { Resource } from './resource.js';

/**
 * The endpoints that answer `format=csv`: the lists, and an endorser's track
 * record and agreement.
 */
export type CsvPath =
  | '/v1/elections'
  | '/v1/coverage'
  | '/v1/contests'
  | '/v1/endorsers'
  | '/v1/endorsements'
  | '/v1/candidates'
  | '/v1/issue-positions'
  | '/v1/officeholders'
  | `/v1/endorsers/${string}/record`
  | `/v1/endorsers/${string}/agreement`;

/**
 * Lists as CSV (`format=csv`), for spreadsheets, R, pandas and the like. The
 * rows are the same records the JSON methods return, paged the same way; the
 * columns of each CSV are in the data dictionaries
 * (https://api.ballotdata.ai/docs/dictionary#csv).
 *
 * `params` are the same as the matching list method's (`client.endorsements.list`
 * for `/v1/endorsements`, and so on).
 */
export class CsvResource extends Resource {
  /**
   * One page as CSV, with the cursor for the next.
   *
   * @example
   * const { text, nextCursor } = await client.csv.page('/v1/endorsements', { states: 'CA', limit: 500 });
   */
  page(path: CsvPath, params: Query = {}, options?: RequestOptions): Promise<CsvPage> {
    return this.transport.request<CsvPage>({ method: 'GET', path, query: { ...params, format: 'csv' }, responseType: 'csv', options });
  }

  /**
   * Every page, one after another.
   *
   * @example
   * for await (const { text } of client.csv.pages('/v1/contests', { elections: 'ca-2026-11-03-general' })) {
   *   await appendFile('contests.csv', text);
   * }
   */
  async *pages(path: CsvPath, params: Query = {}, options?: RequestOptions): AsyncGenerator<CsvPage, void, undefined> {
    let cursor = params.cursor as string | undefined;
    for (;;) {
      const page = await this.page(path, cursor ? { ...params, cursor } : params, options);
      yield page;
      if (!page.nextCursor) return;
      cursor = page.nextCursor;
    }
  }

  /**
   * Every page joined into one CSV, with the header line once. Each page is a
   * request, so filter (by election or state) before reading a long list.
   *
   * @example
   * const csv = await client.csv.all('/v1/endorsements', { elections: 'ca-2026-11-03-general' });
   * await writeFile('endorsements.csv', csv);
   */
  async all(path: CsvPath, params: Query = {}, options?: RequestOptions): Promise<string> {
    let out = '';
    for await (const { text } of this.pages(path, params, options)) {
      out += out ? text.slice(text.indexOf('\n') + 1) : text;
    }
    return out;
  }
}
