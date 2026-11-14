/**
 * Types for everything the BallotData API sends and accepts.
 *
 * They follow the OpenAPI description at https://api.ballotdata.ai/openapi.json.
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

/**
 * Language for ballot text.
 *
 * - `en`: English (the default).
 * - `es`: Spanish ballot text (titles, choices, measure text, statements) where the state publishes it;
 *   English where it doesn’t. Names are never translated.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#lang
 */
export type Lang = 'en' | 'es';

/**
 * Level of the district a contest is voted in.
 *
 * - `federal`: The whole country, or a U.S. House district.
 * - `state`: A whole state, or a state legislative, judicial or other state district.
 * - `county`: A county (a parish in Louisiana, a borough in Alaska) or a district within one.
 * - `city`: A city, town, township, village or borough, or a ward or council district within one.
 * - `school`: A school district, community college district, or a trustee area within one.
 * - `special`: A special district: water, fire, hospital, park, transit, port, conservation and the like.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#district-level
 */
export type Level = 'federal' | 'state' | 'county' | 'city' | 'school' | 'special';

/**
 * What a contest decides.
 *
 * - `candidate`: A race for an office: voters choose among candidates.
 * - `measure`: A ballot measure (proposition, amendment, bond, tax, referendum or initiative): voters
 *   answer Yes or No.
 * - `retention`: A judicial retention question: should this judge stay in office? Voters answer Yes or No.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#contest-kind
 */
export type ContestKind = 'candidate' | 'measure' | 'retention';

/**
 * How votes are cast in a contest.
 *
 * - `plurality`: Vote for one: the candidate with the most votes wins (or goes to a runoff where a
 *   majority is required).
 * - `multi_seat`: Vote for up to N (votes_allowed): several seats are filled at once and the top N win.
 * - `ranked_choice`: Ranked choice: voters rank up to ranks_allowed candidates; endorsements carry the
 *   endorser’s rank 1, 2, 3…. rcv_rounds holds the official tabulation once there is one.
 * - `approval`: Approval voting: voters mark every candidate they approve of; the most-approved win
 *   (Fargo, St. Louis).
 * - `yes_no`: A Yes or No question: every measure and retention question.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#vote-method
 */
export type VoteMethod = 'plurality' | 'multi_seat' | 'ranked_choice' | 'approval' | 'yes_no';

/**
 * Kind of election.
 *
 * - `general`: A general election: the November election (or a state’s regular election day) that fills
 *   offices and decides measures.
 * - `primary`: A primary: voters choose each party’s nominee, or (in top-two and Louisiana-style states)
 *   the candidates who go on to the general.
 * - `special`: A special election held outside the regular schedule, usually to fill a vacancy or decide a
 *   measure.
 * - `special_primary`: The primary for a special election.
 * - `runoff`: A runoff between the leading candidates when no one won the earlier round outright (the
 *   share needed is in the contest’s details.majority_required or vote_required).
 * - `consolidated`: Several jurisdictions’ elections held together on one ballot (a city and school
 *   election on the same day, for example); details.consolidated_with names them.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#election-type
 */
export type ElectionType = 'general' | 'primary' | 'special' | 'special_primary' | 'runoff' | 'consolidated';

/**
 * How a state runs its primaries.
 *
 * - `none`: No primary system is recorded for this election.
 * - `closed`: Only voters registered with a party may vote in its primary.
 * - `semi_closed`: A party’s registered voters, plus unaffiliated voters who choose that party’s ballot.
 * - `open`: Any registered voter may choose any one party’s ballot.
 * - `top_two`: Every candidate is on one primary ballot whatever their party, and the top two go on to the
 *   general (Washington, California).
 * - `top_four`: Every candidate is on one primary ballot, and the top four go on to a ranked-choice
 *   general (Alaska).
 * - `nonpartisan`: Candidates run without party labels; the leading candidates go on, or a majority wins
 *   outright.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#primary-system
 */
export type PrimarySystem = 'none' | 'closed' | 'semi_closed' | 'open' | 'top_two' | 'top_four' | 'nonpartisan';

/**
 * An answer on a measure or retention question.
 *
 * - `yes`: The Yes line of a measure or retention question. On an endorsement: the endorser says vote Yes.
 * - `no`: The No line. On an endorsement: the endorser says vote No.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#measure-answer
 */
export type MeasureAnswer = 'yes' | 'no';

/**
 * The election stage an endorsement is for.
 *
 * - `general`: The endorsement is for a general, special or consolidated election.
 * - `primary`: The endorsement is for a primary or special primary.
 * - `runoff`: The endorsement is for a runoff.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#stage
 */
export type EndorsementStage = 'general' | 'primary' | 'runoff';

/**
 * What kind of race a candidate contest is.
 *
 * - `regular`: An election for a full term on the regular schedule.
 * - `special`: An election for the rest of an unexpired term, or a contest in a special election.
 * - `recall`: A recall: whether to remove an officeholder before the term ends (and, where the ballot has
 *   one, who replaces them).
 * - `retention`: A judicial retention question.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#race-type
 */
export type RaceType = 'regular' | 'special' | 'recall' | 'retention';

/**
 * The office a contest fills, normalized across states.
 *
 * - `president`: President of the United States (with the vice president on the same ticket).
 * - `us_senator`: U.S. Senator.
 * - `us_representative`: U.S. Representative, or a non-voting delegate to the House.
 * - `governor`: Governor.
 * - `lieutenant_governor`: Lieutenant governor.
 * - `attorney_general`: State attorney general.
 * - `secretary_of_state`: Secretary of state.
 * - `state_treasurer`: State treasurer.
 * - `state_auditor`: State auditor, comptroller or controller.
 * - `state_superintendent`: State superintendent of public instruction (the elected head of state
 *   schools).
 * - `insurance_commissioner`: State insurance commissioner.
 * - `agriculture_commissioner`: State agriculture commissioner.
 * - `land_commissioner`: State land commissioner (public lands).
 * - `labor_commissioner`: State labor commissioner.
 * - `utility_commission`: A state utility, public service or corporation commission seat.
 * - `university_board`: A state university board of regents or trustees seat.
 * - `state_board_of_education`: A state board of education seat.
 * - `state_senator`: State senator (the upper house of the legislature; Nebraska’s one-house Legislature
 *   too).
 * - `state_representative`: State representative, assemblymember or delegate (the lower house).
 * - `state_supreme_court`: A justice of the state’s highest court.
 * - `state_appellate_court`: A judge of a state intermediate appeals court.
 * - `trial_court`: A judge of a general trial court: superior, district, circuit, county or probate court.
 * - `municipal_court`: A city or municipal court judge.
 * - `magistrate`: A magistrate.
 * - `justice_of_the_peace`: A justice of the peace.
 * - `court_clerk`: Clerk of a court.
 * - `mayor`: Mayor.
 * - `local_executive`: Another elected local chief executive: county executive or judge-executive, borough
 *   or parish president, first selectman, town or township supervisor, village president.
 * - `city_council`: A city, town, village or borough council, select board or board of aldermen seat.
 * - `county_legislature`: A county commission, board of supervisors, county council, quorum or fiscal
 *   court, or police jury seat.
 * - `neighborhood_council`: A neighborhood body: Washington, D.C.’s Advisory Neighborhood Commissions, for
 *   example.
 * - `school_board`: A school board or board of education seat.
 * - `school_superintendent`: An elected county or district school superintendent.
 * - `college_board`: A community college district board seat.
 * - `special_district_board`: A board of a special district: hospital, fire, park, library, transit, port,
 *   utility and similar.
 * - `water_conservation_board`: A soil and water conservation, water, irrigation, drainage or flood
 *   control district board.
 * - `sheriff`: Sheriff.
 * - `prosecutor`: District attorney, state’s attorney, county attorney or solicitor.
 * - `coroner`: Coroner or medical examiner.
 * - `constable`: Constable (or town sergeant).
 * - `assessor`: Assessor, appraiser or property valuation administrator.
 * - `tax_collector`: Tax collector or tax commissioner.
 * - `treasurer`: A county, city or town treasurer.
 * - `auditor`: A county, city or town auditor, comptroller or controller.
 * - `recorder`: Recorder or register of deeds, wills or probate.
 * - `clerk`: A county, city or town clerk, prothonotary or registrar.
 * - `surveyor`: County surveyor or engineer.
 * - `public_works`: Highway, road or street commissioner, or a public works office.
 * - `police_fire`: An elected police chief, fire chief or marshal.
 * - `other_county_office`: Another county office: public defender, public administrator, jailer, election
 *   director and similar.
 * - `other`: An office that fits none of the types above.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#office-type
 */
export type ContestOfficeType =
  | 'president' | 'us_senator' | 'us_representative'
  | 'governor' | 'lieutenant_governor' | 'attorney_general' | 'secretary_of_state' | 'state_treasurer' | 'state_auditor'
  | 'state_superintendent' | 'insurance_commissioner' | 'agriculture_commissioner' | 'land_commissioner' | 'labor_commissioner'
  | 'utility_commission' | 'university_board' | 'state_board_of_education' | 'state_senator' | 'state_representative'
  | 'state_supreme_court' | 'state_appellate_court' | 'trial_court' | 'municipal_court' | 'magistrate' | 'justice_of_the_peace' | 'court_clerk'
  | 'mayor' | 'local_executive' | 'city_council' | 'county_legislature' | 'neighborhood_council' | 'school_board' | 'school_superintendent'
  | 'college_board' | 'special_district_board' | 'water_conservation_board' | 'sheriff' | 'prosecutor' | 'coroner' | 'constable'
  | 'assessor' | 'tax_collector' | 'treasurer' | 'auditor' | 'recorder' | 'clerk' | 'surveyor' | 'public_works' | 'police_fire'
  | 'other_county_office' | 'other';

/** What office a contest fills, worked out from its title and district. */
export interface ContestOffice {
  type: ContestOfficeType;
  /** State courts are state, whatever district they sit in. */
  level: OfficeLevel;
  branch: OfficeBranch;
}

/**
 * Level of government an office belongs to. State courts are state, whatever district they sit in.
 *
 * - `federal`: A federal office: president, U.S. senator, U.S. representative.
 * - `state`: A statewide or state legislative office, or a state court judge (whatever district the court
 *   sits in).
 * - `local`: A county, city, town, school or special-district office.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#office-level
 */
export type OfficeLevel = 'federal' | 'state' | 'local';

/**
 * Branch of government an office belongs to.
 *
 * - `executive`: Runs government: president, governor, mayor, sheriff, clerk, treasurer and other
 *   officers.
 * - `legislative`: Makes laws or policy as a body: Congress, legislatures, councils, commissions and
 *   boards.
 * - `judicial`: A judge, justice, magistrate or justice of the peace.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#office-branch
 */
export type OfficeBranch = 'executive' | 'legislative' | 'judicial';

/**
 * A topic ballot measures are tagged with.
 *
 * - `taxes`: Taxes: new or changed taxes, levies, millage, fees, assessments and exemptions.
 * - `bonds`: Bonds and borrowing: general obligation bonds, debt, lease-purchase.
 * - `budgets`: Budgets and spending limits: appropriations, revenue and spending caps.
 * - `education`: Education and schools: school funding, facilities, districts and colleges.
 * - `housing`: Housing: affordable housing, rent, homelessness.
 * - `elections`: Elections and voting: how elections are run, voting rules, redistricting.
 * - `government`: Government structure and charters: charter amendments, who appoints whom, how offices
 *   work.
 * - `term_limits`: Term limits for elected officials.
 * - `ethics`: Ethics and transparency: conflicts of interest, open records, campaign finance.
 * - `local_boundaries`: Annexation, incorporation and dissolution: changing a city’s or district’s
 *   boundaries, merging or dissolving one.
 * - `public_safety`: Police, fire and emergency services.
 * - `criminal_justice`: Criminal justice: sentencing, courts, jails, victims’ rights.
 * - `health`: Health care and hospitals.
 * - `mental_health`: Mental health and addiction services.
 * - `environment`: Environment and conservation: open space, pollution, climate.
 * - `energy`: Energy: power generation, fuels, renewables.
 * - `water`: Water and sewer: water supply, treatment and rights.
 * - `transportation`: Transportation and roads: transit, highways, streets.
 * - `parks_recreation`: Parks and recreation.
 * - `libraries`: Libraries.
 * - `land_use`: Land use and zoning: development, planning, growth limits.
 * - `economic_development`: Economic development: business incentives, tourism, development districts.
 * - `cannabis`: Marijuana: legalization, sales, local bans.
 * - `alcohol`: Alcohol: liquor sales, local option (wet/dry) questions.
 * - `gambling`: Gambling: casinos, sports betting, lotteries.
 * - `abortion`: Abortion and reproductive rights.
 * - `civil_rights`: Civil rights: equal rights, discrimination, privacy.
 * - `labor`: Labor and wages: minimum wage, paid leave, unions.
 * - `pensions`: Pensions and public employees: retirement benefits, pay and rules for government workers.
 * - `firearms`: Firearms.
 * - `utilities`: Utilities and broadband: public utilities, franchises, internet service.
 * - `immigration`: Immigration and citizenship.
 * - `veterans`: Veterans’ benefits and services.
 * - `animals`: Animals: animal welfare, hunting, fishing.
 * - `seniors`: Seniors: services and tax relief for older residents.
 * - `children`: Children and families: child care, youth services.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#measure-topic
 */
export type MeasureTopicSlug =
  | 'taxes' | 'bonds' | 'budgets' | 'education' | 'housing' | 'elections' | 'government' | 'term_limits' | 'ethics'
  | 'local_boundaries' | 'public_safety' | 'criminal_justice' | 'health' | 'mental_health' | 'environment' | 'energy'
  | 'water' | 'transportation' | 'parks_recreation' | 'libraries' | 'land_use' | 'economic_development' | 'cannabis'
  | 'alcohol' | 'gambling' | 'abortion' | 'civil_rights' | 'labor' | 'pensions' | 'firearms' | 'utilities' | 'immigration'
  | 'veterans' | 'animals' | 'seniors' | 'children';

export interface MeasureTopic {
  slug: MeasureTopicSlug;
  name: string;
}

/**
 * Level of an officeholder’s office.
 *
 * - `federal`: Congress.
 * - `state`: A statewide office or the state legislature.
 * - `city`: The Council of the District of Columbia.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#officeholder-level
 */
export type OfficeholderLevel = 'federal' | 'state' | 'city';

/**
 * Where a contact detail came from.
 *
 * - `wikidata`: Wikidata (CC0): website and social accounts.
 * - `open_states`: Open States (CC0): an incumbent’s official email, phone, website and social accounts.
 * - `fec_filing`: The campaign committee’s Federal Election Commission filing: its mailing address.
 * - `official_filing`: A state, county or city candidate list or campaign-finance filing.
 * - `campaign_website`: The campaign’s own website.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#contact-source-kind
 */
export type ContactSourceKind = 'wikidata' | 'open_states' | 'fec_filing' | 'official_filing' | 'campaign_website';

/**
 * Offices covered by officeholders.
 *
 * - `us_senator`: U.S. Senator.
 * - `us_representative`: U.S. Representative, or a non-voting delegate.
 * - `governor`: Governor (or D.C.’s mayor).
 * - `lieutenant_governor`: Lieutenant governor.
 * - `attorney_general`: State attorney general.
 * - `secretary_of_state`: Secretary of state.
 * - `chief_election_officer`: The state’s chief election officer, where that isn’t the secretary of state.
 * - `treasurer`: State treasurer.
 * - `auditor`: State auditor or comptroller.
 * - `state_senator`: State senator (upper house).
 * - `state_representative`: State representative, assemblymember or delegate (lower house).
 * - `state_legislator`: A member of a one-house legislature (Nebraska).
 * - `city_council`: A member of the Council of the District of Columbia.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#officeholder-office
 */
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

/**
 * What happened to an endorsement, in the stream.
 *
 * - `endorsement.created`: A new endorsement.
 * - `endorsement.updated`: An endorsement changed; changed and previous say how.
 * - `endorsement.deleted`: An endorsement was withdrawn or removed.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#event-type
 */
export type EventType = 'endorsement.created' | 'endorsement.updated' | 'endorsement.deleted';

/**
 * What happened to an endorsement: the short form of the event type, used in types filters.
 *
 * - `created`: A new endorsement.
 * - `updated`: An existing endorsement changed; changed lists the fields.
 * - `deleted`: The endorsement was withdrawn by the endorser or removed by us.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#change
 */
export type ChangeType = 'created' | 'updated' | 'deleted';

/**
 * Every error code the API returns, in error.code.
 *
 * - `missing_api_key`: No API key was sent. Send it as Authorization: Bearer <key> (or X-API-Key).
 * - `invalid_api_key`: The key isn’t one we issued: mistyped, cut off, or from another site.
 * - `revoked_api_key`: The key was revoked in the console. Use another key.
 * - `expired_api_key`: The key passed the expiry date set on it.
 * - `ip_not_allowed`: The key is limited to certain addresses and this request came from another.
 * - `account_pending`: The account is waiting for approval.
 * - `account_suspended`: The account is suspended. Write to us.
 * - `account_closed`: The account is closed.
 * - `insufficient_scope`: The key lacks the scope this endpoint needs (data:read, stream:read or
 *   subscriptions:write).
 * - `no_access`: The account’s purchases don’t include this part of the API (the stream, for example), or
 *   they have ended.
 * - `outside_purchase`: The record is in a state or election the account hasn’t bought. The message says
 *   what it does cover.
 * - `invalid_parameter`: A parameter has a value we can’t use: the message names it.
 * - `invalid_cursor`: The cursor isn’t one we gave out. Pass next_cursor back exactly as you got it.
 * - `invalid_filter`: A stream filter parameter is invalid: the message says which.
 * - `invalid_json`: The request body isn’t valid JSON.
 * - `invalid_subscription`: The subscription’s name or filter is invalid: the message says which.
 * - `body_too_large`: The request body is over 100 KB.
 * - `not_found`: Nothing has that id or slug.
 * - `subscription_not_found`: No subscription in your account has that id or name.
 * - `conflict`: A subscription with that name already exists in your account.
 * - `too_many_requests`: Too many requests from one address. Wait for Retry-After seconds.
 * - `too_many_failures`: Too many requests with a missing or wrong key from one address. Wait for
 *   Retry-After seconds.
 * - `rate_limit_exceeded`: Over your plan’s requests a minute. Wait for Retry-After seconds.
 * - `daily_limit_exceeded`: Over your plan’s requests a day (the day is UTC).
 * - `too_many_streams`: Your account already has as many streams open as its plan allows.
 * - `cursor_expired`: The cursor or since time is older than the 7 days of changes the stream keeps. Start
 *   again with from=earliest, and catch up with GET /v1/changes.
 * - `warming_up`: The stream is still loading on this server. Try again in a few seconds.
 * - `server_busy`: This server has too many open streams. Try again.
 * - `not_available`: This data isn’t loaded yet (officeholders, for example). Try again later.
 * - `internal_error`: Something went wrong on our side. Quote request_id when you write to us.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#error-code
 */
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
  consolidated_with?: string | string[];
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
  /** A past election kept for its results and history (the November 5, 2024 general, for example). */
  historical?: boolean;
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
  /** Contests on the ballot with a result. */
  result_count: number;
}

// ---------------------------------------------------------------- results

/**
 * How final a result is.
 *
 * - `unofficial`: Election-night and canvass counts: still changing. We read them again every day until
 *   they’re certified.
 * - `certified`: The canvass is certified: the final official count.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#result-status
 */
export type ResultStatus = 'unofficial' | 'certified';

/**
 * Where a result comes from.
 *
 * - `official`: A state, county, city or federal election office.
 * - `compiled`: Certified official returns compiled by a research group (the MIT Election Data and Science
 *   Lab’s precinct returns), summed to the contest. Used for past elections; official_url links to the
 *   state’s own results where we have them.
 * - `party`: A state or national party’s announcement of the winner, with no vote counts (party_reported
 *   is true). Replaced as soon as an official result appears.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#result-source-kind
 */
export type ResultSourceKind = 'official' | 'compiled' | 'party';

/** One choice's line in a contest's result. */
export interface ChoiceResult {
  /** Votes for this choice. null only on a party-reported result, which names a winner without counts. */
  votes: number | null;
  /** Share of the contest's votes, 0 to 100, as the source gives it. */
  vote_pct: number | null;
  /** true for a winner, false for a choice that lost, null when not decided or not stated (a runoff). */
  winner: boolean | null;
}

/** A line the source reports that isn't a choice on the printed ballot, such as a named write-in. */
export interface OtherResultLine {
  label: string | null;
  votes: number | null;
  /** A write-in candidate. */
  write_in: boolean;
}

/** A contest's result. Each choice's votes are on the choice (`choices[].result`). */
export interface ContestResult {
  status: ResultStatus;
  source_kind: ResultSourceKind;
  /** true when the result is a party's announcement (`source_kind` `party`), not an official count. */
  party_reported: boolean;
  /** Votes cast: the printed choices plus write-ins. null on a party-reported result. */
  total_votes: number | null;
  precincts_reporting: number | null;
  precincts_total: number | null;
  source: {
    /** Who published the result, e.g. "California Secretary of State". */
    name: string;
    /** Where it was published. Every result has one. */
    url: string;
    /** The contest's name in the source. */
    contest_name: string | null;
    /** When the source last updated it, if it says. */
    updated_at: string | null;
  };
  /** For a compiled result, the state's own certified results, where known. */
  official_url: string | null;
  /** Further announcements of the same result. */
  more_sources: { name: string | null; url: string }[];
  write_in_votes: number | null;
  blank_votes: number | null;
  over_votes: number | null;
  under_votes: number | null;
  /** Lines the source reports that aren't on the printed ballot. */
  other_choices: OtherResultLine[];
  /** Ranked choice: the official tabulation's rounds, as the source reports them. */
  rcv_rounds: Record<string, unknown>[] | null;
  notes: string | null;
  /** When BallotData last read it from the source. */
  fetched_at: string;
}

/** A contest's result in brief, on a {@link CandidateContest}. */
export interface ContestResultBrief {
  status: ResultStatus;
  source_kind: ResultSourceKind;
  party_reported: boolean;
  total_votes: number | null;
  source_url: string;
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
  /** The candidates are known, but their party lines haven't been checked against a printed ballot yet. */
  party_lines_unverified?: boolean;
  /** `notice` where `description` summarizes an official notice (Ohio) instead of quoting the ballot. */
  question_wording?: string;
  [key: string]: unknown;
}

/** A candidate's name in parts, split from the full name. */
export interface NameParts {
  given: string | null;
  middle: string | null;
  /** Family (last) name, with particles such as "de la" or "Van". */
  family: string | null;
  /** Jr., Sr., II, III, … */
  suffix: string | null;
  /** The name in quotes or parentheses on the ballot. */
  nickname: string | null;
}

/** A candidate's ids in other public systems. */
export interface CandidateIds {
  /** Federal Election Commission candidate id (U.S. House and Senate candidates). */
  fec: string | null;
  /** Congressional Biographical Directory id (sitting members of Congress). */
  bioguide: string | null;
}

export type SocialNetwork = 'facebook' | 'x' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok' | 'threads' | 'bluesky';

/** How to reach a candidate: website and social accounts from Wikidata, the FEC filing address, and the campaign's own site. */
export interface Contact {
  /** Website, from Wikidata or (for an incumbent) the official site. */
  website: string | null;
  email: string | null;
  phone: string | null;
  /** Campaign committee mailing address, from its FEC filing. */
  mailing_address: string | null;
  /** Social accounts (full URLs), from Wikidata or the campaign's own site. Only networks found are present. */
  social: Partial<Record<SocialNetwork, string>>;
  /** Where each detail came from. */
  sources: { url: string; kind: ContactSourceKind; read_on: DateString }[];
}

/** FEC campaign finance totals for one two-year cycle. */
export interface Finance {
  /** The cycle by its last year: 2026 = 2025-2026. */
  cycle: number;
  committee_id: string | null;
  receipts: number;
  disbursements: number;
  cash_on_hand: number;
  debts: number;
  individual_contributions: number | null;
  /** The date the totals run through. */
  coverage_end: DateString | null;
  source_url: string;
}

/** A candidate. */
export interface Candidate {
  id: number;
  full_name: string;
  name: NameParts;
  /** Campaign website. */
  website_url: string | null;
  photo_url: string | null;
  ids: CandidateIds;
  contact: Contact;
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
  /** The candidate holds this seat now: true or false where known, null where not yet (and for a measure answer). */
  incumbent: boolean | null;
  /** For a measure answer: what a Yes (or No) vote means, as the election office words it. */
  vote_meaning: string | null;
  /** Endorsers who endorsed this choice (for a measure: who back this answer). */
  endorsement_count: number;
  /** The candidate; null for a measure answer. */
  candidate: Candidate | null;
  /** The party (or party preference) printed beside the name. */
  party: Party | null;
  /** The party text exactly as printed, where it differs (fusion lines, top-two preferences). */
  party_label: string | null;
  /** This choice's votes, once the contest has a result; null before then. */
  result: ChoiceResult | null;
}

/** A contest without its choices, as embedded in an {@link EndorsementDetail}. */
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
  /** A short description or question. For a measure with `ballot_text`, often a summary. */
  description: string | null;
  /** A measure's wording exactly as printed on the ballot; null where BallotData doesn't have it yet. */
  ballot_text: string | null;
  /** The official full text of a measure. */
  full_text_url: string | null;
  /** A candidate contest with no more candidates still running than seats. Always false for measures. */
  unopposed: boolean;
  /** Position on the printed ballot. */
  ballot_order: number | null;
  /** For a party primary, the party. */
  party: Party | null;
  details: ContestDetails;
  /** The official source the contest was loaded from. */
  source_url: string | null;
  /** The office a candidate or retention contest fills; null for a measure. */
  office: ContestOffice | null;
  /** regular, special (rest of an unexpired term), recall or retention; null for a measure. */
  race_type: RaceType | null;
  /** Candidates run with a party label; null for a measure or retention question. */
  partisan: boolean | null;
  /** A measure's topics (`client.measureTopics.list()`); empty for candidate contests. */
  topics: MeasureTopicSlug[];
  district: District;
  election: Election;
  /** The election result, once a source has one; null before then. */
  result: ContestResult | null;
}

/** A contest with every choice, in ballot order. */
export interface Contest extends ContestBase {
  choices: Choice[];
}

/** One choice an endorser picked, inside a {@link Position}. */
export interface Pick {
  /** The endorsement's id (`client.endorsements.get(id)`). */
  endorsement_id: number;
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
  added_by: AddedBy;
  stage: EndorsementStage;
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
  /** Contests this endorser takes a position in, across every election you can read. A ranked-choice order or vote-for-N slate counts once. */
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
  /** Contests this endorser takes a position in, across every election you can read. */
  endorsement_count: number;
  /** Elections the endorser has endorsed in, newest first. */
  elections: EndorserElection[];
}

/** How a set of an endorser's picks did. */
export interface RecordTally {
  /** Contests counted. */
  contests: number;
  /** Top picks in those contests: a ranked-choice first choice, every candidate of a vote-for-N slate, the Yes or No on a measure. */
  picks: number;
  /** Picks whose choice won: elected, advanced, or the measure answer carried. */
  won: number;
  /** Picks whose choice lost. */
  lost: number;
  /** Picks with no winner yet: no result, a result that doesn't name winners, or a runoff to come. */
  undecided: number;
  /** `won / (won + lost)`, 0 to 1; null until a pick is decided. */
  win_rate: number | null;
  /** The average vote share (0 to 100) of the picked choices that have one. */
  avg_vote_pct: number | null;
  /** Picks of a candidate who holds the seat now. */
  incumbent_picks: number;
  incumbent_won: number;
  /** Picks of a candidate known not to hold the seat. Unknown incumbency and measure answers are in neither count. */
  non_incumbent_picks: number;
  non_incumbent_won: number;
}

/** An endorser's track record, from {@link EndorsersResource.record}. */
export interface EndorserRecord {
  endorser: EndorserRef;
  totals: RecordTally;
  /** The same counts for each kind of contest. */
  by_kind: (RecordTally & { kind: ContestKind })[];
  /** The same counts for each election stage. */
  by_stage: (RecordTally & { stage: EndorsementStage })[];
  /** The same counts for each election, newest first. */
  elections: (RecordTally & { election: { slug: string; name: string; date: DateString; type: ElectionType } })[];
}

/** How often one other endorser took the same side. */
export interface AgreementRow {
  endorser: EndorserRef;
  /** Contests both endorsers took a position in. */
  shared_contests: number;
  /** Contests where both made the same top picks. */
  agreed: number;
  /** Contests where their picks overlap but differ (vote-for-N slates). */
  partly_agreed: number;
  /** Contests where they have no top pick in common. */
  disagreed: number;
  /** `agreed / shared_contests`, 0 to 1. */
  agreement_rate: number;
}

/** From {@link EndorsersResource.agreement}. */
export interface EndorserAgreement {
  endorser: EndorserRef;
  /** Contests this endorser took a position in, with the filters applied. */
  contests: number;
  /** Other endorsers, most contests in common first. */
  compared: AgreementRow[];
}

// ------------------------------------------------------------- endorsements

/**
 * How an endorsement got here.
 *
 * - `automatic`: Added by our automatic watch of the endorser’s own website. It only adds a candidate the
 *   endorser’s own page names for that election; source_url is that page.
 * - `staff`: Entered by hand by BallotData staff.
 * - `data_load`: Loaded in one of our researched data passes.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#added-by
 */
export type AddedBy = 'automatic' | 'staff' | 'data_load';

/**
 * The endorsement fields a change can touch.
 *
 * - `choice_id`: The endorser now backs a different choice in the same contest.
 * - `rank`: The ranked-choice rank changed.
 * - `statement`: What the endorser said changed.
 * - `source_url`: Where it was published changed.
 * - `published_on`: The publication date changed.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#changed-field
 */
export type HistoryField = 'choice_id' | 'rank' | 'statement' | 'source_url' | 'published_on';

/** An endorsement's values at one point in time. */
export interface HistoryValues {
  choice_id: number;
  /** That choice's label; null if the choice has since been removed from the ballot. */
  choice_label: string | null;
  rank: number | null;
  statement: string | null;
  source_url: string | null;
  published_on: DateString | null;
}

/** One change to an endorsement, from {@link EndorsementsResource.history}. */
export interface HistoryEntry {
  /** When the change was made. */
  at: DateTimeString;
  change: 'created' | 'updated' | 'deleted';
  /** For `updated`: the fields that changed. */
  changed: HistoryField[];
  /** The values before; null for `created`. */
  before: HistoryValues | null;
  /** The values after; null for `deleted`. */
  after: HistoryValues | null;
}

/** One change to an endorsement, from {@link ChangesResource.list}. */
export interface Change extends HistoryEntry {
  /** The change's id: increasing and unique. */
  id: number;
  endorsement_id: number;
  endorser: { id: number; slug: string | null; name: string | null; category: Category | null };
  contest: { id: number; title: string };
  election: { id: number; slug: string; date: DateString };
}

/**
 * The basics of one endorser's endorsement of one choice, from
 * {@link EndorsementsResource.list}. A ranked-choice endorsement of three
 * candidates is three of these, with ranks 1 to 3. The full record is
 * {@link EndorsementsResource.get}.
 */
export interface Endorsement {
  /** Endorsement id: `client.endorsements.get(id)` has the full record. */
  id: number;
  /** Ranked choice: the rank the endorser gave; null otherwise. */
  rank: number | null;
  /** When it was published. */
  published_on: DateString | null;
  added_by: AddedBy;
  stage: EndorsementStage;
  /** Who made the endorsement. */
  endorser: { id: number; slug: string; name: string };
  /** The contest: `client.contests.get(id)` has its choices and every position. */
  contest: { id: number; title: string };
  /** The contest's election. */
  election: { id: number; slug: string; date: DateString };
  /** The choice endorsed: the candidate's ballot name, or Yes / No. */
  choice: { id: number; label: string; measure_answer: MeasureAnswer | null };
}

/** Who made an endorsement, inside {@link EndorsementDetail}. */
export interface EndorsementEndorser extends EndorserRef {
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  /** The party, for a party or party club. */
  party: Party | null;
}

/** One endorsement in full, from {@link EndorsementsResource.get}. */
export interface EndorsementDetail {
  id: number;
  /** Ranked choice: the rank the endorser gave; null otherwise. */
  rank: number | null;
  /** What the endorser said. */
  statement: string | null;
  /** Where it was published. */
  source_url: string | null;
  published_on: DateString | null;
  /** When BallotData collected it. */
  retrieved_at: DateTimeString;
  added_by: AddedBy;
  stage: EndorsementStage;
  endorser: EndorsementEndorser;
  /** The contest with its district, election and voting rules. */
  contest: ContestBase;
  /** The choice with its candidate and party. */
  choice: Choice;
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
  level: OfficeholderLevel;
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
    added_by: AddedBy;
  };
  /** For `endorsement.updated`: the fields that changed. Empty for other events. */
  changed: HistoryField[];
  /** For `endorsement.updated`: the values before the change; null for other events. */
  previous: {
    choice_id: number;
    rank: number | null;
    statement: string | null;
    source_url: string | null;
    published_on: DateString | null;
  } | null;
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
    /** The candidate holds the seat now: true or false where known, null where not (and for a measure answer). */
    incumbent: boolean | null;
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
  /** Only contests for these offices. */
  offices?: ListParam<ContestOfficeType>;
  /** Only measures on any of these topics. */
  topics?: ListParam<MeasureTopicSlug>;
  /** Only elections from yesterday on. */
  upcoming?: boolean;
  /** true: only contests with a result; false: only those without one yet. */
  has_result?: boolean;
  /** Only contests whose result has one of these statuses. */
  result_statuses?: ListParam<ResultStatus>;
}

/** Parameters for {@link ContestsResource.get}: which endorsers' positions to include. */
/** Arguments for {@link EndorsementsResource.get}. */
export type GetEndorsementParams = LangParams;

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
  /** Only endorsers with at least this many contests (`endorsement_count`). Pass 5 to match endorsedby.org's default list. */
  min_endorsements?: number;
}

/** Parameters for {@link EndorsersResource.record}. */
export interface EndorserRecordParams extends LangParams {
  elections?: ListParam;
  /** States the contests are voted in. */
  states?: ListParam<StateCode>;
  contest_kinds?: ListParam<ContestKind>;
  /** Election stages: `primary`, `general` or `runoff`. */
  stages?: ListParam<EndorsementStage>;
}

/** Parameters for {@link EndorsersResource.agreement}. */
export interface EndorserAgreementParams extends EndorserRecordParams {
  /** Compare with only these endorsers (slugs). */
  with?: ListParam;
  /** Compare with only endorsers in these categories. */
  categories?: ListParam;
  /** Leave out endorsers with fewer contests in common than this. Default 3. */
  min_shared?: number;
  /** How many endorsers to compare with, 1–100. Default 25. */
  limit?: number;
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
  /** Only endorsements added or changed at or after this time (ISO 8601, or a Date). */
  changed_since?: string | Date;
  /** Only elections from yesterday on. */
  upcoming?: boolean;
}

/** Parameters for {@link ChangesResource.list}. Limit 1–1000, default 100. */
export interface ListChangesParams extends PageParams {
  /** Changes at or after this time (ISO 8601, or a Date). Required unless you pass a cursor. */
  since?: string | Date;
  categories?: ListParam;
  endorsers?: ListParam;
  elections?: ListParam;
  /** States the contests are voted in. */
  states?: ListParam<StateCode>;
}

/** Parameters for {@link CandidatesResource.list}. Limit 1–500, default 100. */
export interface ListCandidatesParams extends LangParams, PageParams {
  /** Name contains (case-insensitive, up to 100 characters). */
  q?: string;
  /** States the contests are voted in. */
  states?: ListParam<StateCode>;
  elections?: ListParam;
  /** true: only incumbents; false: only candidates known not to hold the seat. */
  incumbent?: boolean;
  /** Only elections from yesterday on. */
  upcoming?: boolean;
}

/** Parameters for {@link IssuePositionsResource.list}. */
export interface ListIssuePositionsParams extends PageParams {
  /** Issue slugs (from {@link IssuesResource.list}). */
  issues?: ListParam;
  stances?: ListParam<IssueStance>;
  /** Candidate ids. */
  candidates?: number | readonly number[];
  /** Contest ids: positions of the candidates on these contests. */
  contests?: number | readonly number[];
  elections?: ListParam;
  /** States the contests are voted in. */
  states?: ListParam<StateCode>;
}

/** Parameters for {@link ElectionsResource.export}. */
export interface ExportElectionParams extends LangParams {
  /** `json` (the default) or `csv`. */
  format?: 'json' | 'csv';
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

// --------------------------------------------------------------- candidates

/** A contest a candidate is on. */
export interface CandidateContest {
  contest: {
    id: number;
    title: string;
    kind: ContestKind;
    vote_method: VoteMethod;
    votes_allowed: number | null;
    ranks_allowed: number | null;
    office: ContestOffice | null;
    race_type: RaceType | null;
  };
  district: { id: number; ocd_id: string | null; name: string; level: Level; state: StateCode | null };
  election: { id: number; slug: string; name: string; date: DateString };
  choice: {
    id: number;
    label: string;
    ballot_designation: string | null;
    withdrawn: boolean;
    party: Party | null;
    party_label: string | null;
    /** The candidate's votes and whether they won, once the contest has a result. */
    result: ChoiceResult | null;
  };
  /** The contest's result, once a source has one. */
  result: ContestResultBrief | null;
  /** Endorsers who endorsed this candidate in this contest. */
  endorsement_count: number;
}

/** A candidate, from {@link CandidatesResource.list}. */
export interface CandidateSummary {
  id: number;
  full_name: string;
  name: NameParts;
  website_url: string | null;
  photo_url: string | null;
  /** Holds the seat now: true or false where known, null where not yet. */
  incumbent: boolean | null;
  ids: CandidateIds;
  contact: Contact;
  /** The contests they're on that you can read, newest election first. */
  contests: CandidateContest[];
}

/** One endorsement a candidate received. */
export interface CandidateEndorsement {
  endorsement_id: number;
  endorser: EndorserRef;
  rank: number | null;
  statement: string | null;
  source_url: string | null;
  published_on: DateString | null;
  added_by: AddedBy;
  stage: EndorsementStage;
}

/** A candidate with every endorsement they received, from {@link CandidatesResource.get}. */
export interface CandidateDetail extends Omit<CandidateSummary, 'contests'> {
  contests: (CandidateContest & { endorsements: CandidateEndorsement[] })[];
  /** FEC campaign finance totals, newest cycle first; empty without an FEC id. */
  finance: Finance[];
  /** Where they stand on common issues, in issue order. Empty where there are none yet. */
  issue_positions: IssuePosition[];
}

// ----------------------------------------------------------- issue positions

/** A policy issue, from {@link IssuesResource.list}. */
export interface Issue {
  slug: string;
  /** Short name: "Abortion". */
  name: string;
  /** The yes/no question a position's `stance` answers. */
  question: string;
  description: string;
}

/**
 * The answer to an issue’s yes/no question; null for a stated position that doesn’t answer it either way.
 *
 * - `supports`: Yes to the issue’s question.
 * - `opposes`: No to the issue’s question.
 * - `mixed`: Yes to part of it, or yes with limits the summary spells out.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#stance
 */
export type IssueStance = 'supports' | 'opposes' | 'mixed';

/**
 * What kind of source a position was taken from.
 *
 * - `candidate_website`: The candidate’s own campaign site.
 * - `voting_record`: An official roll-call vote record (Congress’s or a legislature’s).
 * - `official_statement`: An official statement: a press release or a statement from their office.
 * - `questionnaire`: A published candidate questionnaire.
 * - `debate`: A debate.
 * - `news`: News reporting quoting or describing the candidate.
 *
 * Every value and its meaning: https://api.ballotdata.ai/docs/values#issue-source-kind
 */
export type IssuePositionSourceKind =
  | 'candidate_website'
  | 'voting_record'
  | 'official_statement'
  | 'questionnaire'
  | 'debate'
  | 'news';

/** A link a position was taken from. */
export interface IssuePositionSource {
  url: string;
  kind: IssuePositionSourceKind;
  /** "U.S. Senate", "The Atlanta Journal-Constitution". */
  publisher: string;
  title: string | null;
  published_on: DateString | null;
}

/**
 * Where a candidate stands on one issue, as they stated it or as their votes
 * in Congress show it. Never inferred from party or endorsements.
 */
export interface IssuePosition {
  id: number;
  issue: { slug: string; name: string };
  stance: IssueStance | null;
  /** Where they stand, in neutral words. */
  summary: string;
  /** Their own words, verbatim, where a source has them. */
  quote: string | null;
  /** When the sources were last read. */
  checked_on: DateString;
  /** At least one. */
  sources: IssuePositionSource[];
}

/** A position from {@link IssuePositionsResource.list}, with its candidate and their contests. */
export interface IssuePositionItem extends IssuePosition {
  candidate: { id: number; full_name: string };
  /** The candidate's contests you can read (and that match the filters), newest election first. */
  contests: { id: number; title: string; election: { slug: string; date: DateString }; state: StateCode | null }[];
}

// ------------------------------------------------------------------ exports

/** A contest in an {@link ElectionExport}: its election is given once at the top. */
export type ExportContest = Omit<ContestBase, 'election'> & { choices: Choice[]; endorsements: Position[] };

/** A whole election, from {@link ElectionsResource.export}. */
export interface ElectionExport {
  election: Election;
  /** Every contest you can read, in ballot order: races from federal down, then measures. */
  contests: ExportContest[];
}
