// Compiled (not run) by `npm run typecheck`: the public types work as documented.
import {
  ApiError,
  BallotData,
  NotFoundError,
  constructPostback,
  groupByContest,
  type Contest,
  type EndorsementEvent,
  type Filter,
  type Page,
  type StreamMessage,
} from '../../src/index.js';

const client = new BallotData({ apiKey: 'ebk_x', timeout: 10_000, maxRetries: 1, onResponse: (r) => r.rateLimit.remaining });

async function usage(): Promise<void> {
  const page: Page<Contest> = await client.contests.list({ elections: ['ca-2026-11-03-general'], levels: 'county', limit: 20 });
  const first: Contest | undefined = page.data[0];
  const method: 'plurality' | 'multi_seat' | 'ranked_choice' | 'approval' | 'yes_no' | undefined = first?.vote_method;
  void method;

  for await (const e of client.endorsements.list({ states: 'CA', categories: ['labor'] })) {
    const rank: number | null = e.rank;
    const label: string = e.choice.label;
    const election: string = e.election.slug;
    void rank;
    void label;
    void election;
  }

  const full = await client.endorsements.get(90211, { lang: 'es' });
  const source: string | null = full.source_url;
  const vote: 'plurality' | 'multi_seat' | 'ranked_choice' | 'approval' | 'yes_no' = full.contest.vote_method;
  void source;
  void vote;
  for (const { contest, positions } of groupByContest([])) void [contest.title, positions[0]?.picks[0]?.endorsement_id];

  const detail = await client.contests.get(4410, { endorser_states: ['CA', 'national'] });
  detail.endorsements[0]?.picks.map((p) => p.measure_answer);

  const filter: Filter = { categories: ['labor'], states: ['CA'], types: ['created'] };
  await client.subscriptions.create({ name: 'CA labor', filter });

  for await (const message of client.stream.connect({ subscription: 'CA labor' }, { onCursor: (c: string) => c })) {
    const m: StreamMessage = message;
    if (m.type === 'endorsement') {
      const event: EndorsementEvent = m.event;
      const cursor: string = m.cursor;
      void event;
      void cursor;
    }
  }

  const events = await client.events.list({ cursor: 'c1', wait: 20 });
  const more: boolean = events.has_more;
  void more;

  try {
    await client.endorsers.get('nobody');
  } catch (err) {
    if (err instanceof NotFoundError) err.requestId?.toUpperCase();
    if (err instanceof ApiError && err.code === 'outside_purchase') err.status.toFixed();
  }

  // Candidates, changes, history and exports.
  const candidate = await client.candidates.get(8811);
  const received: number = candidate.contests[0]!.endorsements.length;
  const incumbent: boolean | null = candidate.incumbent;
  for await (const change of client.changes.list({ since: new Date(), states: 'CA' })) {
    const before: string | null | undefined = change.before?.statement;
    void before;
  }
  const history = await client.endorsements.history(90211);
  const kind: 'created' | 'updated' | 'deleted' = history[0]!.change;
  const csv: string = await client.elections.export('ca-2026-11-03-general', { format: 'csv' });
  const json = await client.elections.export('ca-2026-11-03-general');
  const text: string | null = json.contests[0]!.ballot_text;
  void [received, incumbent, kind, csv, text];

  const decided = await client.contests.list({ elections: 'ca-2024-11-05-general', has_result: true, result_statuses: ['certified'] });
  const result = decided.data[0]?.result;
  const kindOfSource: 'official' | 'compiled' | 'party' | undefined = result?.source_kind;
  const votes: number | null | undefined = decided.data[0]?.choices[0]?.result?.votes;
  const won: boolean | null | undefined = (await client.candidates.get(8811)).contests[0]?.choice.result?.winner;
  const historical: boolean | undefined = (await client.elections.list()).data[0]?.details.historical;
  void [kindOfSource, votes, won, historical, result?.source.url];

  const flips = await client.results.list({ years: 2024, offices: 'us_representative', flipped: true, max_margin_pct: 5 });
  const margin: number | undefined = flips.data[0]?.margin?.pct_points;
  const flippedFrom: string[] | undefined = flips.data[0]?.seat_change?.parties_going_in;
  const seatCounts = await client.seatChanges.get({ years: [2024], group_by: 'state' });
  const net: number | undefined = seatCounts.totals.parties[0]?.net;
  void [margin, flippedFrom, net];

  const postback = await constructPostback('{}', 't=1,v1=00', 'secret');
  postback.changes.map((c) => c.type);

  // @ts-expect-error an unknown vote method is a type error
  const bad: Contest['vote_method'] = 'pick_some';
  void bad;
}
void usage;
