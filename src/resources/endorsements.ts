import type { PagePromise, RequestOptions } from '../core.js';
import type { Endorsement, ListEndorsementsParams } from '../types.js';
import { Resource } from './resource.js';

/** `GET /v1/endorsements`. */
export class EndorsementsResource extends Resource {
  /**
   * Endorsements, one per endorser and choice, each with its endorser,
   * contest (with district and election) and choice. A ranked-choice
   * endorsement of three candidates is three rows with ranks 1–3.
   *
   * This is the way to sync everything, or to catch up after the stream.
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
}
