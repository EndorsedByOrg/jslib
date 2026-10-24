/**
 * Types for everything the BallotData API sends and accepts.
 *
 * They follow the OpenAPI description at https://api.ballotdata.net/openapi.json.
 * Field names are kept exactly as the API sends them (snake_case), so what you
 * see in the API reference is what you get here.
 *
 * @module
 */

// ---------------------------------------------------------------- scalars

/** A two-letter USPS state code, e.g. `"CA"`. D.C. and territories are included. */
export type StateCode = string;

/** A calendar date as `YYYY-MM-DD`. */
export type DateString = string;

/** A time as ISO 8601, e.g. `"2026-10-14T21:07:33.512Z"`. */
export type DateTimeString = string;

/** Language for ballot text. `es` returns Spanish where the state publishes it, English otherwise. Names are never translated. */
export type Lang = 'en' | 'es';

/** Level of government a district belongs to. */
export type Level = 'federal' | 'state' | 'county' | 'city' | 'school' | 'special';

/** What a contest decides: an office, a ballot measure, or whether to keep a judge. */
export type ContestKind = 'candidate' | 'measure' | 'retention';

/**
 * How votes are cast in a contest.
 *
 * - `plurality`: vote for one (or `votes_allowed`).
 * - `multi_seat`: vote for up to `votes_allowed`.
 * - `ranked_choice`: rank up to `ranks_allowed`.
 * - `approval`: vote for as many as you approve of.
 * - `yes_no`: a measure or retention question.
 */
export type VoteMethod = 'plurality' | 'multi_seat' | 'ranked_choice' | 'approval' | 'yes_no';

/** Kind of election. */
export type ElectionType = 'general' | 'primary' | 'special' | 'special_primary' | 'runoff' | 'consolidated';

/** How a state runs its primaries. */
export type PrimarySystem = 'none' | 'closed' | 'semi_closed' | 'open' | 'top_two' | 'nonpartisan';

/** An answer on a measure or retention question. */
export type MeasureAnswer = 'yes' | 'no';

/** Offices covered by {@link Officeholder}. */
export type Office =
  | 'us_senator'
  | 'us_representative'
  | 'governor'
  | 'lieutenant_governor'
  | 'attorney_general'
  | 'secretary_of_state'
  | 'chief_election_officer'
  | 'treasurer'
  | 'auditor'
  | 'state_senator'
  | 'state_representative'
  | 'state_legislator'
  | 'city_council';

/** What happened to an endorsement, in the stream. */
export type EventType = 'endorsement.created' | 'endorsement.updated' | 'endorsement.deleted';

/** The short form of {@link EventType}, used in `types` filters. */
export type ChangeType = 'created' | 'updated' | 'deleted';

/** Every error code the API returns, in `error.code`. */
export type ErrorCode =
  | 'missing_api_key'
  | 'invalid_api_key'
  | 'revoked_api_key'
  | 'expired_api_key'
  | 'ip_not_allowed'
  | 'account_pending'
  | 'account_suspended'
  | 'account_closed'
  | 'insufficient_scope'
  | 'no_access'
  | 'outside_purchase'
  | 'invalid_parameter'
  | 'invalid_cursor'
  | 'invalid_filter'
  | 'invalid_json'
  | 'invalid_subscription'
  | 'body_too_large'
  | 'not_found'
  | 'subscription_not_found'
  | 'conflict'
  | 'too_many_requests'
  | 'too_many_failures'
  | 'rate_limit_exceeded'
  | 'daily_limit_exceeded'
  | 'too_many_streams'
  | 'cursor_expired'
  | 'warming_up'
  | 'server_busy'
  | 'not_available'
  | 'internal_error';

/** A list parameter: an array, or a comma-separated string. Any value matches. */
export type ListParam<T extends string = string> = T | readonly T[];

// ----------------------------------------------------------- reference data

/** A state, D.C. or territory. */
export interface State {
  /** USPS code, used in `states` filters. */
  code: StateCode;
  /** Two-digit FIPS code, e.g. `"06"`. */
  fips: string;
  /** Full name. */
  name: string;
}

/** A political party. */
export interface Party {
  /** Party slug, e.g. `"democratic"`. */
  slug: string;
  /** Party name. */
  name: string;
  /** Short form as printed, e.g. `"DEM"`. */
  abbreviation: string | null;
}

/** The kind of endorser, as attached to an endorser. */
export interface Category {
  /** Category slug, used in `categories` filters, e.g. `"labor"`. */
  slug: string;
  /** Display name. */
  name: string;
}

/** An endorser category with its count, from {@link EndorserCategoriesResource.list}. */
export interface EndorserCategory {
  /** Category slug, used in `categories` filters. */
  slug: string;
  /** Display name (plural): "Labor". */
  name: string;
  /** One of them: "Labor union". */
  singular_name: string;
  /** Endorsers in this category. */
  endorser_count: number;
}

/** What the API has for one state, from {@link CoverageResource.list}. */
export interface Coverage {
  state: StateCode;
  /** State name. */
  name: string;
  election_count: number;
  contest_count: number;
  /** Of the contests, ballot measures. */
  measure_count: number;
  /** Endorsers with endorsements here. */
  endorser_count: number;
  endorsement_count: number;
  /** Contests with at least one endorsement. */
  endorsed_contest_count: number;
  first_election: DateString | null;
  last_election: DateString | null;
  /** When a contest or endorsement here last changed. */
  updated_at: DateTimeString | null;
}

// ---------------------------------------------------------------- elections

/** Voting rules for an election. Only keys that apply are present. */
export interface ElectionDetails {
  /** Every voter is mailed a ballot. */
  all_mail?: boolean;
  /** Some contests use ranked choice voting. */
  ranked_choice?: boolean;
  /** Candidates can appear on more than one party's line (New York, Connecticut). */
  fusion_voting?: boolean;
  /** A party primary. */
  partisan_primary?: boolean;
  /** Which primary, where a state holds several. */
  primary?: string;
  /** Elections held on the same ballot. */
  consolidated_with?: string;
  /** Date of a runoff, if one is needed. */
  runoff_date?: DateString;
  /** Date of the runoff election. */
  runoff_election_date?: DateString;
  /** Date of the top-two primary that chose these candidates. */
  top_two_primary_date?: DateString;
  /** Louisiana's open (jungle) primary. */
  louisiana_open_primary?: boolean;
  /** Anything else voters should know. */
  note?: string;
  [key: string]: unknown;
}

/** An election. */
export interface Election {
  id: number;
  /** Slug used in `elections` filters: `<state>-<date>-<type>`, e.g. `"ca-2026-11-03-general"`. */
  slug: string;
  name: string;
  short_name: string | null;
  /** Election day. */
  date: DateString;
  /** State; null for a multi-state election. */
  state: StateCode | null;
  type: ElectionType;
  primary_system: PrimarySystem | null;
  /** Official election page. */
  info_url: string | null;
  details: ElectionDetails;
}

/** An election with counts, from {@link ElectionsResource.list}. */
export interface ElectionSummary extends Election {
  /** Contests on the ballot. */
  contest_count: number;
  /** Endorsements in those contests. */
  endorsement_count: number;
}

// ---------------------------------------------------------------- contests

/** The district a contest is voted in. */
export interface District {
  /** District id. Matches an officeholder's `district_id`. */
  id: number;
  /** Open Civic Data division id, used in `districts` filters. */
  ocd_id: string | null;
  name: string;
  level: Level;
  /** statewide, congressional, state_upper, state_lower, county, council, school, … */
  type: string;
  state: StateCode | null;
}

/** Facts about a contest. Only keys that apply are present. */
export interface ContestDetails {
  /** Only one candidate is running. */
  uncontested?: boolean;
  /** Candidates appear without a party. */
  nonpartisan?: boolean;
  /** bond, charter_amendment, initiative, referendum, tax, … */
  measure_type?: string;
  /** Share of the vote needed to pass, e.g. "2/3" or "55%". */
  vote_required?: string;
  /** A candidate needs a majority to win outright (else a runoff). */
  majority_required?: boolean;
  /** Dollar amount of a bond or tax measure. */
  amount?: number;
  /** Length of the term, e.g. "4 years". */
  term?: string;
  /** The seat is for the remainder of an unexpired term. */
  short_term?: boolean;
  /** The judge or justice a retention question is about. */
  justice?: string;
  /** Date of a runoff, if one is needed. */
  runoff_date?: DateString;
  /** Stage of a multi-round contest. */
  stage?: string;
  /** Elected by the whole jurisdiction, not by district. */
  elected_at_large?: boolean;
  /** The ballot offers "None of these candidates" (Nevada). */
  none_of_these?: boolean;
  /** The primary nominates a party's candidate. */
  primary_nominating?: boolean;
  /** Number of winners, where it differs from votes_allowed. */
  winners?: number;
  /** Kind of referendum. */
  ref_type?: string;
  [key: string]: unknown;
}

/** A candidate. */
export interface Candidate {
  id: number;
  full_name: string;
  /** Campaign website. */
  website_url: string | null;
  photo_url: string | null;
}

/** A line a voter can mark: a candidate, or a Yes/No answer. */
export interface Choice {
  /** Choice id: the `choice_id` endorsements refer to. */
  id: number;
  /** As printed: the candidate's ballot name, or Yes / No. */
  label: string;
  /** `yes` or `no` for a measure or retention question; null for a candidate. */
  measure_answer: MeasureAnswer | null;
  /** A special line: `none_of_these` (Nevada). */
  option: 'none_of_these' | null;
  /** Occupation line printed under the name, e.g. "Transit Planner". */
  ballot_designation: string | null;
  /** The candidate withdrew but is still printed on the ballot. */
  withdrawn: boolean;
  /** The candidate; null for a measure answer. */
  candidate: Candidate | null;
  /** The party (or party preference) printed beside the name. */
  party: Party | null;
  /** The party text exactly as printed, where it differs (fusion lines, top-two preferences). */
  party_label: string | null;
}

/** A contest without its choices, as embedded in an {@link Endorsement}. */
export interface ContestBase {
  id: number;
  /** Title as printed on the ballot. */
  title: string;
  short_title: string | null;
  kind: ContestKind;
  vote_method: VoteMethod;
  /** How many choices a voter may mark (vote for N). */
  votes_allowed: number | null;
  /** Ranked choice: how many choices a voter may rank. */
  ranks_allowed: number | null;
  /** The measure's letter or number: "K", "Prop 1". */
  measure_code: string | null;
  /** Measure text or question, where the ballot prints one. */
  description: string | null;
  /** Position on the printed ballot. */
  ballot_order: number | null;
  /** For a party primary, the party. */
  party: Party | null;
  details: ContestDetails;
  /** The official source the contest was loaded from. */
  source_url: string | null;
  district: District;
  election: Election;
}

/** A contest with every choice, in ballot order. */
export interface Contest extends ContestBase {
  choices: Choice[];
}

/** One choice an endorser picked, inside a {@link Position}. */
export interface Pick {
  /** The {@link Choice} endorsed. */
  choice_id: number;
  /** That choice's label. */
  label: string;
  measure_answer: MeasureAnswer | null;
  /** Ranked choice: 1 for first choice, 2 for second, …; null otherwise. */
  rank: number | null;
  /** What the endorser said about it. */
  statement: string | null;
  /** Where the endorsement was published. */
  source_url: string | null;
  /** When it was published. */
  published_on: DateString | null;
}

/**
 * One endorser's position in a contest: one pick for vote-for-one, up to N
 * for vote-for-N, the ranking for ranked choice, Yes or No for a measure.
 */
export interface Position {
  endorser: EndorserRef;
  picks: Pick[];
}

/** A contest with every endorser's position, from {@link ContestsResource.get}. */
export interface ContestDetail extends Contest {
  /** Every (matching) endorser's position, by endorser name. */
  endorsements: Position[];
}

// ---------------------------------------------------------------- endorsers

/** Who made an endorsement (the short form embedded in other objects). */
export interface EndorserRef {
  id: number;
  /** Used in `endorsers` filters. */
  slug: string;
  name: string;
  category: Category;
  /** Home state; null for national endorsers. */
  state: StateCode | null;
}

/** An endorser, from {@link EndorsersResource.list}. */
export interface Endorser extends EndorserRef {
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  /** The party, for a party or party club. */
  party: Party | null;
  /** Endorsements this endorser has made, in every election. */
  endorsement_count: number;
}

/** An election an endorser endorsed in, inside {@link EndorserDetail}. */
export interface EndorserElection {
  /** Election slug. */
  election: string;
  name: string;
  date: DateString;
  /** Contests this endorser took a position in. */
  contests: number;
}

/** One endorser with their elections, from {@link EndorsersResource.get}. */
export interface EndorserDetail extends EndorserRef {
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  party: Party | null;
  /** Elections the endorser has endorsed in, newest first. */
  elections: EndorserElection[];
}

// ------------------------------------------------------------- endorsements

/** The choice an {@link Endorsement} is for. */
export interface EndorsedChoice {
  id: number;
  label: string;
  measure_answer: MeasureAnswer | null;
  option: 'none_of_these' | null;
  withdrawn: boolean;
  candidate: { id: number; full_name: string } | null;
  party: Party | null;
  party_label: string | null;
}

/**
 * One endorser's endorsement of one choice. A ranked-choice endorsement of
 * three candidates is three of these, with ranks 1 to 3.
 */
export interface Endorsement {
  id: number;
  /** Ranked choice: the rank the endorser gave; null otherwise. */
  rank: number | null;
  /** What the endorser said. */
  statement: string | null;
  /** Where it was published. */
  source_url: string | null;
  published_on: DateString | null;
  endorser: EndorserRef;
  contest: ContestBase;
  choice: EndorsedChoice;
}

// ------------------------------------------------------------ officeholders

/** A person in office now, from Open States. */
export interface Officeholder {
  /** Open States person id; the same across terms and offices. */
  person_id: string;
  name: string;
  given_name: string | null;
  family_name: string | null;
  office: Office;
  /** Title the state uses: "Assemblymember", "Delegate". */
  office_title: string;
  level: 'federal' | 'state' | 'city';
  state: StateCode;
  /** District as the legislature names it: "12", "1A", "21st Middlesex". */
  district: string | null;
  /** OCD division id of the seat. */
  district_ocd_id: string;
  /** The matching contest {@link District} id, where there is one. */
  district_id: number | null;
  /** Party as published: "Democratic", "Republican/Conservative". */
  party: string | null;
  party_abbreviation: string | null;
  term_start: DateString | null;
  term_end: DateString | null;
  email: string | null;
  /** Office phone (capitol office first). */
  phone: string | null;
  website_url: string | null;
  image_url: string | null;
  /** Offices with their addresses and phones. */
  offices: { classification?: string; address?: string; voice?: string; fax?: string }[];
  /** Social accounts, where known. */
  social: { twitter?: string; facebook?: string; instagram?: string; youtube?: string };
  /** Where the data came from. */
  source_urls: string[];
  /** Last refreshed. */
  updated_at: DateTimeString;
}

/** One officeholder with every seat they hold, from {@link OfficeholdersResource.get}. */
export interface OfficeholderDetail extends Officeholder {
  /** Every seat they hold (rarely more than one). */
  seats: Officeholder[];
}

// ------------------------------------------------------------------ stream

/**
 * One endorsement change, from the stream, polling, or a postback. Use `id`
 * to drop repeats: it is unique and increases.
 */
export interface EndorsementEvent {
  /** The change's id: increasing and unique. */
  id: string;
  type: EventType;
  /** When the change was made. */
  occurred_at: DateTimeString;
  endorsement: {
    id: number;
    rank: number | null;
    statement: string | null;
    source_url: string | null;
    published_on: DateString | null;
  };
  endorser: {
    id: number;
    slug: string | null;
    name: string | null;
    category: Category | null;
    /** Home state, or null for national. */
    state: StateCode | null;
  };
  contest: {
    id: number;
    title: string | null;
    short_title: string | null;
    kind: ContestKind | null;
    vote_method: VoteMethod | null;
    votes_allowed: number | null;
    ranks_allowed: number | null;
    measure_code: string | null;
    district: { id: number; name: string; level: Level; ocd_id: string | null; state: StateCode | null } | null;
  };
  election: { id: number; slug: string; name: string; date: DateString; state: StateCode | null; type: ElectionType } | null;
  choice: {
    id: number;
    label: string | null;
    measure_answer: MeasureAnswer | null;
    candidate: { id: number; full_name: string } | null;
    party: { slug: string; name: string } | null;
    withdrawn: boolean | null;
  };
}

/**
 * Which endorsements a stream, poll or subscription covers. Fields combine
 * with AND, values within a field with OR, and a missing field matches
 * everything. Each field takes at most 500 values.
 */
export interface Filter {
  /** Endorser category slugs ({@link EndorserCategoriesResource.list}). */
  categories?: string[];
  /** Endorser slugs. */
  endorsers?: string[];
  /** Endorsers' home states (USPS codes), or `"national"`. */
  endorser_states?: string[];
  /** States the contests are voted in. */
  states?: StateCode[];
  /** Election slugs. */
  elections?: string[];
  contest_kinds?: ContestKind[];
  levels?: Level[];
  /** Kinds of change. */
  types?: ChangeType[];
}

/** A saved filter, from {@link SubscriptionsResource}. */
export interface Subscription {
  id: number;
  /** Name, unique in your account. */
  name: string;
  filter: Filter;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

/** What to send when creating or replacing a {@link Subscription}. */
export interface SubscriptionInput {
  /** 1–100 letters, digits, spaces, dots, dashes or underscores. */
  name: string;
  /** Leave out to match every endorsement your account can see. */
  filter?: Filter;
}

/** A batch of changes POSTed to your endpoint (a postback). */
export interface Postback {
  /** Increases with each delivery to your endpoint. */
  delivery_id: number;
  sent_at: DateTimeString;
  changes: EndorsementEvent[];
}

// --------------------------------------------------------------- parameters

/** `lang` on endpoints that return ballot text. */
export interface LangParams {
  /** `es` for Spanish ballot text where the state publishes it. Default `en`. */
  lang?: Lang;
}

/** Paging on list endpoints. */
export interface PageParams {
  /** Results per page. The maximum differs by endpoint. */
  limit?: number;
  /** The `next_cursor` from the previous page. */
  cursor?: string;
}

/** Parameters for {@link ElectionsResource.list}. */
export interface ListElectionsParams extends LangParams, PageParams {
  states?: ListParam<StateCode>;
  types?: ListParam<ElectionType>;
  /** Only elections from yesterday on. */
  upcoming?: boolean;
  /** Elections on or after this date. */
  from?: DateString;
  /** Elections on or before this date. */
  to?: DateString;
}

/** Parameters for {@link CoverageResource.list}. */
export interface CoverageParams {
  /** Count only upcoming elections. Default true. */
  upcoming?: boolean;
}

/** Parameters for {@link ContestsResource.list}. Limit 1–200, default 50. */
export interface ListContestsParams extends LangParams, PageParams {
  elections?: ListParam;
  states?: ListParam<StateCode>;
  levels?: ListParam<Level>;
  contest_kinds?: ListParam<ContestKind>;
  /** OCD division ids of the districts. */
  districts?: ListParam;
  /** Only elections from yesterday on. */
  upcoming?: boolean;
}

/** Parameters for {@link ContestsResource.get}: which endorsers' positions to include. */
export interface GetContestParams extends LangParams {
  /** Only endorsers in these categories. */
  categories?: ListParam;
  /** Only these endorsers (slugs). */
  endorsers?: ListParam;
  /** Only endorsers based in these states, or `national`. */
  endorser_states?: ListParam;
}

/** Parameters for {@link EndorsersResource.list}. Limit 1–500, default 100. */
export interface ListEndorsersParams extends LangParams, PageParams {
  categories?: ListParam;
  /** Home states (USPS codes), or `national`. */
  states?: ListParam;
  /** Only endorsers with endorsements in these elections. */
  elections?: ListParam;
  /** Name contains (case-insensitive, up to 100 characters). */
  q?: string;
}

/** Parameters for {@link EndorsementsResource.list}. Limit 1–500, default 100. */
export interface ListEndorsementsParams extends LangParams, PageParams {
  categories?: ListParam;
  endorsers?: ListParam;
  /** Endorsers' home states, or `national`. */
  endorser_states?: ListParam;
  elections?: ListParam;
  /** States the contests are voted in. */
  states?: ListParam<StateCode>;
  contest_kinds?: ListParam<ContestKind>;
  levels?: ListParam<Level>;
  /** Only this contest. */
  contest?: number;
  /** Only elections from yesterday on. */
  upcoming?: boolean;
}

/** Parameters for {@link OfficeholdersResource.list}. Limit 1–500, default 100. */
export interface ListOfficeholdersParams extends LangParams, PageParams {
  states?: ListParam<StateCode>;
  offices?: ListParam<Office>;
  levels?: ListParam<'federal' | 'state' | 'city'>;
  /** OCD division ids of the seats. */
  districts?: ListParam;
  /** Name contains. */
  q?: string;
}

/**
 * Which changes to read from the stream or `/v1/events`, and where to start.
 * Give either `subscription` or filter fields, not both.
 */
export interface StreamParams {
  /** A saved subscription's id or name, instead of filter fields. */
  subscription?: string | number;
  categories?: ListParam;
  endorsers?: ListParam;
  endorser_states?: ListParam;
  states?: ListParam<StateCode>;
  elections?: ListParam;
  contest_kinds?: ListParam<ContestKind>;
  levels?: ListParam<Level>;
  types?: ListParam<ChangeType>;
  /** Resume after this position: a `next_cursor` or an event's `cursor`. */
  cursor?: string;
  /** Where to start without a cursor. Default `latest`. */
  from?: 'latest' | 'earliest';
  /** Start at changes from this time, within the stream's retention. */
  since?: DateTimeString | Date;
}

/** Parameters for {@link EventsResource.list}. */
export interface ListEventsParams extends StreamParams {
  /** Events per page, 1–1000. Default 100. */
  limit?: number;
  /** Seconds (0–25) to hold the request open until a matching change arrives. Default 0. */
  wait?: number;
}

/** A page of changes from `/v1/events`. */
export interface EventsPage {
  /** Changes, oldest first. */
  data: EndorsementEvent[];
  /** Send as `cursor` next time. */
  next_cursor: string;
  /** More are waiting: call again now. */
  has_more: boolean;
}

// ------------------------------------------------------------ response meta

/** Rate-limit headers from the last response. Values are null when the API didn't send them. */
export interface RateLimit {
  /** Requests allowed per minute on your plan. */
  limit: number | null;
  /** Requests left this minute. */
  remaining: number | null;
  /** Seconds until the minute resets. */
  reset: number | null;
  /** Requests allowed per UTC day, on plans with a daily cap. */
  dailyLimit: number | null;
  /** Requests left today. */
  dailyRemaining: number | null;
}

/** Facts about one HTTP response, passed to the `onResponse` option and kept on `client.lastResponse`. */
export interface ResponseInfo {
  method: string;
  url: string;
  status: number;
  /** The X-Request-Id header. Quote it when you write to BallotData. */
  requestId: string | null;
  rateLimit: RateLimit;
}
