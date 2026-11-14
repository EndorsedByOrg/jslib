/**
 * The official JavaScript and TypeScript client for the BallotData API: U.S.
 * ballots, endorsers and endorsements, officeholders, offices and their holders
 * since 2020, and a live stream of
 * endorsement changes.
 *
 * ```ts
 * import { BallotData } from 'ballotdata';
 * const client = new BallotData({ apiKey: process.env.BALLOTDATA_API_KEY });
 * ```
 *
 * @packageDocumentation
 */

export { BallotData } from './client.js';
export { DEFAULT_BASE_URL, PagePromise, encodeQuery } from './core.js';
export type { ClientOptions, CsvPage, Page, Query, RequestOptions } from './core.js';
export {
  ApiError,
  AuthenticationError,
  BadRequestError,
  BallotDataError,
  ConflictError,
  ConnectionError,
  CursorExpiredError,
  InternalServerError,
  NotFoundError,
  PayloadTooLargeError,
  PermissionDeniedError,
  RateLimitError,
  TimeoutError,
} from './errors.js';
export { groupByContest, sortPicks } from './helpers.js';
export type { ContestEndorsements, EndorsementPick, EndorsementPosition } from './helpers.js';
export {
  PostbackSignatureError,
  SIGNATURE_HEADER,
  constructPostback,
  signPostback,
  verifyPostbackSignature,
} from './postbacks.js';
export type { RawBody, VerifyOptions } from './postbacks.js';
export { CandidatesResource } from './resources/candidates.js';
export { IssuePositionsResource, IssuesResource } from './resources/issues.js';
export { ChangesResource } from './resources/changes.js';
export { ContestsResource, MeasureTopicsResource } from './resources/contests.js';
export { ElectionsResource } from './resources/elections.js';
export { EndorsementsResource } from './resources/endorsements.js';
export { EndorsersResource } from './resources/endorsers.js';
export { CsvResource } from './resources/csv.js';
export type { CsvPath } from './resources/csv.js';
export { OfficeholdersResource } from './resources/officeholders.js';
export { OfficesResource, OfficeTermsResource } from './resources/offices.js';
export { CoverageResource, EndorserCategoriesResource, StatesResource } from './resources/reference.js';
export { EndorsementStream, EventsResource, StreamResource } from './resources/stream.js';
export type { FollowOptions, StreamMessage, StreamOptions } from './resources/stream.js';
export { SubscriptionsResource } from './resources/subscriptions.js';
export { parseSse } from './sse.js';
export type { SseMessage } from './sse.js';
export type * from './types.js';
export { VERSION } from './version.js';
