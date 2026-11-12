import type { PagePromise, RequestOptions } from '../core.js';
import type { Issue, IssuePositionItem, ListIssuePositionsParams } from '../types.js';
import { Resource } from './resource.js';

/** `GET /v1/issues`: the policy issues candidates' positions are recorded on. */
export class IssuesResource extends Resource {
  /**
   * Every issue (abortion, guns, immigration, schools, the safety net, …) in
   * display order. Each is a yes/no `question` that a position's `stance`
   * answers. Use the slugs in `issues` filters.
   *
   * @example
   * const issues = await client.issues.list();
   */
  async list(options?: RequestOptions): Promise<Issue[]> {
    const res = await this.transport.request<{ data: Issue[] }>({ method: 'GET', path: '/v1/issues', options });
    return res.data;
  }
}

/** `GET /v1/issue-positions`: where candidates stand on common issues. */
export class IssuePositionsResource extends Resource {
  /**
   * Where candidates stand, one row per candidate and issue, each with a
   * neutral summary, their own words where there are any, and the links it
   * came from (their site, debates, questionnaires, news, or official
   * roll-call votes for members of Congress). Paged: limit 1–1000, default 100.
   *
   * @example
   * for await (const p of client.issuePositions.list({ issues: 'abortion', states: 'GA' })) {
   *   console.log(p.candidate.full_name, p.stance, p.sources[0]?.url);
   * }
   */
  list(params: ListIssuePositionsParams = {}, options?: RequestOptions): PagePromise<IssuePositionItem> {
    return this.transport.list<IssuePositionItem>('/v1/issue-positions', { ...params }, options);
  }
}
