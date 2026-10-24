import type { PagePromise, RequestOptions } from '../core.js';
import type { Contest, ContestDetail, GetContestParams, ListContestsParams } from '../types.js';
import { Resource, seg } from './resource.js';

/** `GET /v1/contests` and `GET /v1/contests/{id}`. */
export class ContestsResource extends Resource {
  /**
   * The races on the ballot, each with its district, its election, its voting
   * rules (`vote_method`, `votes_allowed`, `ranks_allowed`) and every choice in
   * ballot order. Filter by election, state, level, kind or district.
   *
   * To see who endorsed whom, use {@link ContestsResource.get} or
   * `client.endorsements.list()`.
   *
   * Paged: limit 1–200, default 50.
   *
   * @example
   * for await (const contest of client.contests.list({ elections: 'ca-2026-11-03-general', levels: 'county' })) {
   *   console.log(contest.title, contest.vote_method, contest.choices.length);
   * }
   */
  list(params: ListContestsParams = {}, options?: RequestOptions): PagePromise<Contest> {
    return this.transport.list<Contest>('/v1/contests', { ...params }, options);
  }

  /**
   * One contest with its choices and every endorser's position: one pick for
   * vote-for-one, up to N picks for vote-for-N, ranked picks for ranked
   * choice, Yes or No for a measure. Narrow the endorsers with `categories`,
   * `endorsers` or `endorser_states`.
   *
   * @throws {NotFoundError} when no contest has that id.
   * @example
   * const contest = await client.contests.get(4410, { categories: ['labor', 'editorial'] });
   * for (const { endorser, picks } of contest.endorsements) {
   *   console.log(endorser.name, picks.map((p) => p.rank ? `${p.rank}. ${p.label}` : p.label));
   * }
   */
  async get(id: number, params: GetContestParams = {}, options?: RequestOptions): Promise<ContestDetail> {
    const res = await this.transport.request<{ data: ContestDetail }>({
      method: 'GET',
      path: `/v1/contests/${seg(id)}`,
      query: { ...params },
      options,
    });
    return res.data;
  }
}
