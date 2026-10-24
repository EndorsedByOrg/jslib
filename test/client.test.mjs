import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import {
  ApiError,
  AuthenticationError,
  BallotData,
  ConflictError,
  ConnectionError,
  NotFoundError,
  PagePromise,
  PermissionDeniedError,
  RateLimitError,
  TimeoutError,
  VERSION,
  encodeQuery,
  groupByContest,
} from '../dist/esm/index.js';
import { ENDORSEMENTS, KEY, startFakeApi } from './fake-api.mjs';

let fake;
let client;
before(async () => {
  fake = await startFakeApi();
  client = new BallotData({ apiKey: KEY, baseUrl: fake.url });
});
after(() => fake.close());

test('the version matches package.json', () => {
  assert.equal(VERSION, createRequire(import.meta.url)('../package.json').version);
});

test('the CommonJS build loads with require', () => {
  const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.equal(typeof cjs.BallotData, 'function');
  assert.equal(typeof cjs.verifyPostbackSignature, 'function');
});

test('a key is required, from options or BALLOTDATA_API_KEY', () => {
  const saved = process.env.BALLOTDATA_API_KEY;
  delete process.env.BALLOTDATA_API_KEY;
  try {
    assert.throws(() => new BallotData(), /BALLOTDATA_API_KEY/);
    process.env.BALLOTDATA_API_KEY = 'ebk_from_env';
    assert.equal(new BallotData({ baseUrl: fake.url }).baseUrl, fake.url);
  } finally {
    if (saved === undefined) delete process.env.BALLOTDATA_API_KEY;
    else process.env.BALLOTDATA_API_KEY = saved;
  }
});

test('encodeQuery joins lists, writes booleans and dates, and skips empty values', () => {
  const q = encodeQuery({ states: ['CA', 'NV'], upcoming: false, since: new Date('2026-10-01T00:00:00Z'), cursor: undefined, q: '', none: [] });
  assert.equal(q.toString(), 'states=CA%2CNV&upcoming=false&since=2026-10-01T00%3A00%3A00.000Z');
});

test('requests send the key, a user agent, and list parameters', async () => {
  await client.elections.list({ states: ['CA', 'NV'], upcoming: true });
  const req = fake.requests.at(-1);
  assert.equal(req.path, '/v1/elections');
  assert.equal(req.headers.authorization, `Bearer ${KEY}`);
  assert.equal(req.headers['user-agent'], `ballotdata-js/${VERSION}`);
  assert.equal(req.query.get('states'), 'CA,NV');
  assert.equal(req.query.get('upcoming'), 'true');
});

test('every endpoint is reachable', async () => {
  assert.deepEqual((await client.states.list()).map((s) => s.code), ['CA']);
  assert.equal((await client.coverage.list({ upcoming: false }))[0].state, 'CA');
  assert.equal(fake.requests.at(-1).query.get('upcoming'), 'false');
  assert.equal((await client.elections.list()).data[0].slug, 'ca-2026-11-03-general');
  assert.equal((await client.contests.list({ elections: 'ca-2026-11-03-general' })).data.length, 2);
  const contest = await client.contests.get(4410, { categories: ['labor', 'editorial'], lang: 'es' });
  assert.equal(contest.endorsements.length, 2);
  assert.equal(fake.requests.at(-1).query.get('categories'), 'labor,editorial');
  assert.equal(fake.requests.at(-1).query.get('lang'), 'es');
  assert.equal((await client.endorserCategories.list())[0].slug, 'labor');
  assert.equal((await client.endorsers.list({ q: 'labor' })).data[0].slug, 'sf-labor-council');
  assert.equal((await client.endorsers.get('sf-labor-council')).elections.length, 1);
  assert.equal((await client.endorsements.list({ contest: 4410 })).data.length, 4);
  const endorsement = await client.endorsements.get(90211, { lang: 'es' });
  assert.equal(endorsement.endorser.category.slug, 'labor');
  assert.equal(endorsement.contest.election.slug, 'ca-2026-11-03-general');
  assert.equal(endorsement.choice.ballot_designation, 'Transit Planner');
  assert.equal(fake.requests.at(-1).path, '/v1/endorsements/90211');
  assert.equal(fake.requests.at(-1).query.get('lang'), 'es');
  await assert.rejects(client.endorsements.get(9031), (err) => err instanceof PermissionDeniedError && err.code === 'outside_purchase');
  assert.equal((await client.officeholders.list({ states: 'CA' })).data[0].person_id, 'p-1');
  assert.equal((await client.officeholders.get('p-1')).name, 'Alex Morgan');
  assert.equal((await client.events.list({ cursor: 'c0' })).data.length, 3);
});

test('list methods return a page when awaited and every item when iterated', async () => {
  const list = client.endorsements.list({ limit: 3 });
  assert.ok(list instanceof PagePromise);
  const page = await list;
  assert.equal(page.data.length, 3);
  assert.equal(page.next_cursor, '3');
  const ids = [];
  for await (const e of client.endorsements.list({ limit: 3 })) ids.push(e.id);
  assert.deepEqual(ids, ENDORSEMENTS.map((e) => e.id));
  assert.equal((await client.endorsements.list({ limit: 1 }).toArray(2)).length, 2);
  const pages = [];
  for await (const p of client.endorsements.list({ limit: 3 }).pages()) pages.push(p.data.length);
  assert.deepEqual(pages, [3, 1]);
  // A cursor given up front is where paging starts.
  assert.deepEqual((await client.endorsements.list({ limit: 3, cursor: '3' })).data.map((e) => e.id), [90214]);
});

test('paginate and request reach any endpoint', async () => {
  assert.equal((await client.paginate('/v1/endorsements', { limit: 2 }).toArray()).length, 4);
  assert.deepEqual(await client.request('GET', '/v1/states'), { data: [{ code: 'CA', fips: '06', name: 'California' }] });
});

test('errors are typed and carry the code and request id', async () => {
  await assert.rejects(new BallotData({ apiKey: 'ebk_wrong', baseUrl: fake.url }).states.list(), (err) => {
    assert.ok(err instanceof AuthenticationError);
    assert.ok(err instanceof ApiError);
    assert.equal(err.status, 401);
    assert.equal(err.code, 'invalid_api_key');
    assert.equal(err.requestId, 'req-1');
    assert.equal(err.message, 'That API key is not valid.');
    return true;
  });
  await assert.rejects(client.officeholders.get('missing'), NotFoundError);
});

test('429 and 502 are retried; retries can be turned off', async () => {
  const limited = await startFakeApi({ rateLimitFirst: 2 });
  try {
    const c = new BallotData({ apiKey: KEY, baseUrl: limited.url });
    assert.equal((await c.states.list()).length, 1);
    assert.equal(limited.requests.length, 3);
    const once = await startFakeApi({ rateLimitFirst: 1 });
    try {
      await assert.rejects(new BallotData({ apiKey: KEY, baseUrl: once.url, maxRetries: 0 }).states.list(), (err) => {
        assert.ok(err instanceof RateLimitError);
        assert.equal(err.retryAfter, 0.01);
        return true;
      });
    } finally {
      await once.close();
    }
  } finally {
    await limited.close();
  }
  const flaky = await startFakeApi({ failFirst: 1 });
  try {
    assert.equal((await new BallotData({ apiKey: KEY, baseUrl: flaky.url }).states.list()).length, 1);
  } finally {
    await flaky.close();
  }
});

test('a 503 POST is retried; other POST failures are not', async () => {
  const c = new BallotData({ apiKey: KEY, baseUrl: fake.url, maxRetries: 1 });
  const before = fake.requests.length;
  await assert.rejects(c.request('POST', '/v1/busy'), (err) => err.status === 503 && err.code === 'warming_up');
  assert.equal(fake.requests.length - before, 2);
});

test('timeouts and unreachable hosts throw TimeoutError and ConnectionError', async () => {
  await assert.rejects(client.request('GET', '/v1/slow', {}, { timeout: 50, maxRetries: 0 }), TimeoutError);
  await assert.rejects(new BallotData({ apiKey: KEY, baseUrl: 'http://127.0.0.1:1', maxRetries: 0 }).states.list(), ConnectionError);
});

test('an aborted signal stops the request with its reason', async () => {
  const controller = new AbortController();
  const pending = client.request('GET', '/v1/slow', {}, { signal: controller.signal });
  controller.abort(new Error('stop'));
  await assert.rejects(pending, /stop/);
});

test('rate-limit headers are reported on lastResponse and to onResponse', async () => {
  const seen = [];
  const c = new BallotData({ apiKey: KEY, baseUrl: fake.url, onResponse: (info) => seen.push(info) });
  await c.coverage.list();
  assert.deepEqual(c.lastResponse.rateLimit, { limit: 60, remaining: 59, reset: 30, dailyLimit: null, dailyRemaining: null });
  assert.equal(c.lastResponse.requestId, 'req-1');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].status, 200);
});

test('subscriptions: create, get, update, list, conflict, delete', async () => {
  const created = await client.subscriptions.create({ name: 'CA labor', filter: { categories: ['labor'] } });
  assert.equal(fake.requests.at(-1).headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(fake.requests.at(-1).body), { name: 'CA labor', filter: { categories: ['labor'] } });
  assert.equal((await client.subscriptions.get(created.id)).name, 'CA labor');
  await assert.rejects(client.subscriptions.create({ name: 'CA labor' }), ConflictError);
  await client.subscriptions.update(created.id, { name: 'CA labor', filter: { states: ['CA'] } });
  assert.deepEqual((await client.subscriptions.list()).map((s) => s.filter), [{ states: ['CA'] }]);
  assert.equal(await client.subscriptions.delete(created.id), undefined);
  await assert.rejects(client.subscriptions.get(created.id), NotFoundError);
});

test('groupByContest builds positions with ranked picks in order', () => {
  const groups = groupByContest([ENDORSEMENTS[1], ENDORSEMENTS[0], ENDORSEMENTS[2], ENDORSEMENTS[3]]);
  assert.deepEqual(groups.map((g) => g.contest.id), [4410, 9031]);
  const labor = groups[0].positions.find((p) => p.endorser.slug === 'sf-labor-council');
  assert.deepEqual(labor.picks.map((p) => [p.rank, p.label, p.endorsement_id]), [[1, 'Jane Doe', 90211], [2, 'Sam Rivera', 90212]]);
  assert.equal(groups[0].positions.length, 2);
  assert.equal(groups[0].election.slug, 'ca-2026-11-03-general');
  assert.deepEqual(groups[1].positions[0].picks.map((p) => p.measure_answer), ['yes']);
});
