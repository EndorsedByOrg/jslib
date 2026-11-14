import type { RequestOptions } from '../core.js';
import type { BallotLookup, BallotLookupInput } from '../types.js';
import { Resource } from './resource.js';

/** `POST /v1/ballot`: the ballot at a street address. */
export class BallotResource extends Resource {
  /**
   * The ballot at a street address (or a latitude and longitude): the
   * districts it is in on today's lines, and every contest on its ballot, by
   * election and in ballot order. By default every election from 60 days ago
   * on. The address goes in the request body, is found with the U.S. Census
   * Bureau's geocoder and is never stored. A ZIP code, city or state alone is
   * refused.
   *
   * Use `client.contests.get(id)` for each endorser's position in a contest.
   *
   * @throws {NotFoundError} when the address isn't found (`address_not_found`).
   * @throws {BadRequestError} when the address isn't a street address.
   * @example
   * const ballot = await client.ballot.lookup({ address: '1 Dr Carlton B Goodlett Pl, San Francisco, CA 94102' });
   * for (const { election, contests } of ballot.elections) {
   *   console.log(election.name);
   *   for (const c of contests) console.log(`  ${c.title}: ${c.choices.map((x) => x.label).join(', ')}`);
   * }
   */
  async lookup(input: BallotLookupInput, options?: RequestOptions): Promise<BallotLookup> {
    const res = await this.transport.request<{ data: BallotLookup }>({ method: 'POST', path: '/v1/ballot', body: input, options });
    return res.data;
  }
}
