import { Transport, type ClientOptions, type PagePromise, type RequestOptions } from './core.js';
import { ContestsResource } from './resources/contests.js';
import { ElectionsResource } from './resources/elections.js';
import { EndorsementsResource } from './resources/endorsements.js';
import { EndorsersResource } from './resources/endorsers.js';
import { OfficeholdersResource } from './resources/officeholders.js';
import { CoverageResource, EndorserCategoriesResource, StatesResource } from './resources/reference.js';
import { EventsResource, StreamResource } from './resources/stream.js';
import { SubscriptionsResource } from './resources/subscriptions.js';
import type { ResponseInfo } from './types.js';

/**
 * A client for the BallotData API.
 *
 * ```ts
 * import { BallotData } from 'ballotdata';
 *
 * const client = new BallotData(); // reads BALLOTDATA_API_KEY
 * const contest = await client.contests.get(4410, { categories: 'labor' });
 * ```
 *
 * Every method takes an optional last argument of {@link RequestOptions}
 * (`signal`, `timeout`, `maxRetries`, `headers`).
 */
export class BallotData {
  /** `GET /v1/states`. */
  readonly states: StatesResource;
  /** `GET /v1/coverage`. */
  readonly coverage: CoverageResource;
  /** `GET /v1/elections`. */
  readonly elections: ElectionsResource;
  /** `GET /v1/contests`, `GET /v1/contests/{id}`. */
  readonly contests: ContestsResource;
  /** `GET /v1/endorser-categories`. */
  readonly endorserCategories: EndorserCategoriesResource;
  /** `GET /v1/endorsers`, `GET /v1/endorsers/{slug}`. */
  readonly endorsers: EndorsersResource;
  /** `GET /v1/endorsements`. */
  readonly endorsements: EndorsementsResource;
  /** `GET /v1/officeholders`, `GET /v1/officeholders/{id}`. */
  readonly officeholders: OfficeholdersResource;
  /** `GET /v1/stream` (Server-Sent Events). */
  readonly stream: StreamResource;
  /** `GET /v1/events` (polling). */
  readonly events: EventsResource;
  /** `/v1/subscriptions`. */
  readonly subscriptions: SubscriptionsResource;

  readonly #transport: Transport;

  /**
   * @param options Every option is optional. The API key defaults to the
   * `BALLOTDATA_API_KEY` environment variable.
   * @throws Error when there is no API key.
   */
  constructor(options: ClientOptions = {}) {
    const transport = (this.#transport = new Transport(options));
    this.states = new StatesResource(transport);
    this.coverage = new CoverageResource(transport);
    this.elections = new ElectionsResource(transport);
    this.contests = new ContestsResource(transport);
    this.endorserCategories = new EndorserCategoriesResource(transport);
    this.endorsers = new EndorsersResource(transport);
    this.endorsements = new EndorsementsResource(transport);
    this.officeholders = new OfficeholdersResource(transport);
    this.stream = new StreamResource(transport);
    this.events = new EventsResource(transport);
    this.subscriptions = new SubscriptionsResource(transport);
  }

  /** The API origin requests go to. */
  get baseUrl(): string {
    return this.#transport.baseUrl;
  }

  /** Status, request id and rate-limit headers of the most recent response, or null before the first. */
  get lastResponse(): ResponseInfo | null {
    return this.#transport.lastResponse;
  }

  /**
   * Call any endpoint directly, with the client's key, retries and errors.
   * For endpoints added to the API after this version of the library.
   *
   * @example
   * const body = await client.request('GET', '/v1/states');
   */
  request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    init: { query?: Record<string, unknown>; body?: unknown } = {},
    options?: RequestOptions,
  ): Promise<T> {
    return this.#transport.request<T>({ method, path, query: init.query, body: init.body, options });
  }

  /**
   * Walk any paged list endpoint: `{ data, next_cursor }`.
   *
   * @example
   * for await (const item of client.paginate('/v1/endorsements', { states: 'CA' })) { … }
   */
  paginate<T = unknown>(path: string, query: Record<string, unknown> = {}, options?: RequestOptions): PagePromise<T> {
    return this.#transport.list<T>(path, query, options);
  }
}
