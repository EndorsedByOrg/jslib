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

  const postback = await constructPostback('{}', 't=1,v1=00', 'secret');
  postback.changes.map((c) => c.type);

  // @ts-expect-error an unknown vote method is a type error
  const bad: Contest['vote_method'] = 'pick_some';
  void bad;
}
void usage;
