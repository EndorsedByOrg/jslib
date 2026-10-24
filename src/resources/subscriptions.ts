import type { RequestOptions } from '../core.js';
import type { Subscription, SubscriptionInput } from '../types.js';
import { Resource, seg } from './resource.js';

/**
 * `/v1/subscriptions`: saved filters for the stream and `/v1/events`. Use a
 * subscription by id or name as `subscription` in `client.stream.connect()`
 * and `client.events.list()`. An account can have up to 50.
 *
 * Reading needs the `stream:read` scope; changing needs `subscriptions:write`.
 */
export class SubscriptionsResource extends Resource {
  /**
   * Every saved subscription, by name.
   *
   * @example
   * const subs = await client.subscriptions.list();
   */
  async list(options?: RequestOptions): Promise<Subscription[]> {
    const res = await this.transport.request<{ data: Subscription[] }>({ method: 'GET', path: '/v1/subscriptions', options });
    return res.data;
  }

  /**
   * One subscription by id.
   *
   * @throws {NotFoundError} when no subscription has that id.
   */
  async get(id: number, options?: RequestOptions): Promise<Subscription> {
    const res = await this.transport.request<{ data: Subscription }>({ method: 'GET', path: `/v1/subscriptions/${seg(id)}`, options });
    return res.data;
  }

  /**
   * Save a named filter.
   *
   * @throws {ConflictError} when a subscription with that name exists.
   * @example
   * const sub = await client.subscriptions.create({ name: 'CA labor', filter: { categories: ['labor'], states: ['CA'] } });
   */
  async create(input: SubscriptionInput, options?: RequestOptions): Promise<Subscription> {
    const res = await this.transport.request<{ data: Subscription }>({ method: 'POST', path: '/v1/subscriptions', body: input, options });
    return res.data;
  }

  /**
   * Replace a subscription's name and filter. Send every filter field you want
   * to keep. Open streams using it keep the old filter until they reconnect.
   *
   * @throws {NotFoundError} when no subscription has that id.
   * @throws {ConflictError} when another subscription has that name.
   */
  async update(id: number, input: SubscriptionInput, options?: RequestOptions): Promise<Subscription> {
    const res = await this.transport.request<{ data: Subscription }>({
      method: 'PUT',
      path: `/v1/subscriptions/${seg(id)}`,
      body: input,
      options,
    });
    return res.data;
  }

  /**
   * Delete a subscription.
   *
   * @throws {NotFoundError} when no subscription has that id.
   */
  async delete(id: number, options?: RequestOptions): Promise<void> {
    await this.transport.request<void>({ method: 'DELETE', path: `/v1/subscriptions/${seg(id)}`, options });
  }
}
