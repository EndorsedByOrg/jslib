import type { PagePromise, RequestOptions } from '../core.js';
import type { CommitteeContribution, ListCommitteeContributionsParams } from '../types.js';
import { Resource } from './resource.js';

/** `GET /v1/committee-contributions`: what PACs, parties and other committees gave federal candidates (API 1.19.0). */
export class CommitteeContributionsResource extends Resource {
  /**
   * Contributions from political committees to federal candidates, one per
   * line of their FEC filings (2025-2026 cycle): money, goods and services
   * (`in_kind`) and party spending coordinated with the candidate. Each names
   * the committee, the endorser it is or that sponsors it, the candidate and
   * the filing. Memo lines are left out; refunds are negative. A contribution
   * isn't an endorsement. Paged: limit 1–1000, default 100.
   *
   * @example
   * for await (const c of client.committeeContributions.list({ endorsers: 'national-education-association' })) {
   *   console.log(c.candidate.full_name, c.amount, c.date);
   * }
   */
  list(params: ListCommitteeContributionsParams = {}, options?: RequestOptions): PagePromise<CommitteeContribution> {
    return this.transport.list<CommitteeContribution>('/v1/committee-contributions', { ...params }, options);
  }
}
