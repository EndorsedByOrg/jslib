// Every operation in the API's OpenAPI description (a copy in test/openapi.json,
// from https://api.ballotdata.net/openapi.json) has a client method, and that
// method passes every documented query parameter through.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { BallotData } from '../dist/esm/index.js';

const spec = JSON.parse(readFileSync(new URL('./openapi.json', import.meta.url), 'utf8'));

/** operationId → how the client calls it, given every query parameter. */
const CALLS = {
  listStates: (c) => c.states.list(),
  listElections: (c, q) => c.elections.list(q),
  getCoverage: (c, q) => c.coverage.list(q),
  listContests: (c, q) => c.contests.list(q),
  getContest: (c, q) => c.contests.get(4410, q),
  listEndorserCategories: (c, q) => c.endorserCategories.list(q),
  listEndorsers: (c, q) => c.endorsers.list(q),
  getEndorser: (c, q) => c.endorsers.get('sf-labor-council', q),
  listEndorsements: (c, q) => c.endorsements.list(q),
  getEndorsement: (c, q) => c.endorsements.get(90211, q),
  listOfficeholders: (c, q) => c.officeholders.list(q),
  getOfficeholder: (c, q) => c.officeholders.get('4f6a2c1e-8b3d-4e5f-9a7b-1c2d3e4f5a6b', q),
  streamEvents: async (c, q) => {
    for await (const _ of c.stream.connect(q, { reconnect: false }));
  },
  pollEvents: (c, q) => c.events.list(q),
  listSubscriptions: (c) => c.subscriptions.list(),
  createSubscription: (c) => c.subscriptions.create({ name: 'x' }),
  getSubscription: (c) => c.subscriptions.get(7),
  updateSubscription: (c) => c.subscriptions.update(7, { name: 'x' }),
  deleteSubscription: (c) => c.subscriptions.delete(7),
};

let server;
let client;
const requests = [];
before(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    requests.push({ method: req.method, path: url.pathname, query: url.searchParams, headers: req.headers });
    if (url.pathname === '/v1/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      return res.end('id: c1\nevent: ready\ndata: {"subscription":"inline"}\n\n');
    }
    if (req.method === 'DELETE') return res.writeHead(204).end();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: [], next_cursor: null, has_more: false }));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  client = new BallotData({ apiKey: 'ebk_test', baseUrl: `http://127.0.0.1:${server.address().port}` });
});
after(() => new Promise((r) => server.close(r)));

const operations = Object.entries(spec.paths).flatMap(([path, ops]) =>
  Object.entries(ops).map(([method, op]) => ({ path, method: method.toUpperCase(), op })),
);

test('the spec copy has the operations we expect', () => {
  assert.deepEqual(operations.map((o) => o.op.operationId).sort(), Object.keys(CALLS).sort());
});

for (const { path, method, op } of operations) {
  test(`${method} ${path} (${op.operationId})`, async () => {
    const params = (op.parameters ?? []).filter((p) => p.in === 'query');
    const query = Object.fromEntries(params.map((p) => [p.name, p.example ?? (p.schema?.type === 'boolean' ? true : p.schema?.type === 'integer' ? 5 : 'x')]));
    // The stream starts from a cursor or from/since, not both; the client sends a cursor as Last-Event-ID.
    if (op.operationId === 'streamEvents' || op.operationId === 'pollEvents') delete query.subscription;
    const before = requests.length;
    await CALLS[op.operationId](client, query);
    const req = requests[before];
    assert.ok(req, 'no request was made');
    assert.equal(req.method, method);
    assert.match(req.path, new RegExp(`^${path.replace(/\{[^}]+\}/g, '[^/]+')}$`));
    for (const p of params) {
      if (p.name === 'subscription' && !(p.name in query)) continue;
      if (op.operationId === 'streamEvents' && p.name === 'cursor') {
        assert.equal(req.headers['last-event-id'], String(query.cursor));
        continue;
      }
      assert.ok(req.query.has(p.name), `${p.name} was not sent`);
    }
  });
}
