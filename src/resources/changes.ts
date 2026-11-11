import type { PagePromise, RequestOptions } from '../core.js';
import type { Change, ListChangesParams } from '../types.js';
import { Resource } from './resource.js';

/** `GET /v1/changes`. */
export class ChangesResource extends Resource {
  /**
   * Every endorsement added, changed or deleted since a time, oldest first,
   * deletions included, with the values before and after: the way to keep a
   * copy current without the stream. Pass `since` (your last sync), then keep
   * the last page's `next_cursor` for next time. Paged: limit 1–1000, default 100.
   *
   * @example
   * for await (const change of client.changes.list({ since: lastSync, states: 'CA' })) {
   *   if (change.change === 'deleted') await db.remove(change.endorsement_id);
   *   else await db.upsert(change.endorsement_id, change.after);
   * }
   */
  list(params: ListChangesParams = {}, options?: RequestOptions): PagePromise<Change> {
    return this.transport.list<Change>('/v1/changes', { ...params }, options);
  }
}
