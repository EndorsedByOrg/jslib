import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { BallotData, CursorExpiredError, PermissionDeniedError, parseSse } from '../dist/esm/index.js';
import { KEY, startFakeApi } from './fake-api.mjs';

let fake;
let client;
before(async () => {
  fake = await startFakeApi();
  client = new BallotData({ apiKey: KEY, baseUrl: fake.url });
});
after(() => fake.close());

async function* chunks(...parts) {
  for (const part of parts) yield typeof part === 'string' ? new TextEncoder().encode(part) : part;
}
async function collect(iterable, max = Infinity) {
  const out = [];
  for await (const item of iterable) {
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

test('parseSse handles split chunks, CRLF, comments, multi-line data and UTF-8 across chunks', async () => {
  const pena = new TextEncoder().encode('data: Peña\n\n');
  const cut = pena.indexOf(0xc3) + 1;
  const messages = await collect(parseSse(chunks(
    'retry: 5000\n\nid: c1\nevent: endo', 'rsement\ndata: {"a":', '1}\r', '\n\r\n: ping\n\n',
    'data: one\ndata: two\n\n', pena.slice(0, cut), pena.slice(cut), 'event: half',
  )));
  assert.deepEqual(messages, [
    { event: '', data: '', id: undefined, retry: 5000 },
    { event: 'endorsement', data: '{"a":1}', id: 'c1', retry: undefined },
    { event: 'message', data: 'one\ntwo', id: undefined, retry: undefined },
    { event: 'message', data: 'Peña', id: undefined, retry: undefined },
  ]);
});

test('the stream yields events, follows checkpoints and reconnects with Last-Event-ID', async () => {
  const cursors = [];
  const reconnects = [];
  const stream = client.stream.connect({ states: 'CA' }, { onCursor: (c) => cursors.push(c), onReconnect: (i) => reconnects.push(i.reason) });
  const messages = await collect(stream, 4);
  assert.deepEqual(messages.map((m) => m.type), ['ready', 'endorsement', 'ready', 'endorsement']);
  assert.equal(messages[0].subscription, 'inline');
  assert.equal(messages[1].event.id, '1');
  assert.equal(messages[1].cursor, 'c1');
  assert.equal(messages[3].event.type, 'endorsement.deleted');
  assert.equal(stream.cursor, 'c6');
  assert.deepEqual(cursors, ['c0', 'c1', 'c5', 'c6']);
  assert.deepEqual(reconnects, ['reconnect']);
  const [first, second] = fake.requests.filter((r) => r.path === '/v1/stream').slice(-2);
  assert.equal(first.headers['last-event-id'], undefined);
  assert.equal(first.headers.accept, 'text/event-stream');
  assert.equal(first.query.get('states'), 'CA');
  assert.equal(second.headers['last-event-id'], 'c5'); // past the checkpoint
});

test('a starting cursor is sent as Last-Event-ID, not in the query', async () => {
  await collect(client.stream.connect({ cursor: 'c5' }), 1);
  const req = fake.requests.filter((r) => r.path === '/v1/stream').at(-1);
  assert.equal(req.headers['last-event-id'], 'c5');
  assert.ok(!req.query.has('cursor'));
});

test('stream.endorsements() yields only the events', async () => {
  const items = await collect(client.stream.endorsements({ states: 'CA' }), 2);
  assert.deepEqual(items.map((i) => i.event.id), ['1', '6']);
});

test('a silent connection is dropped and reopened', async () => {
  const before = fake.streamConnections;
  const reasons = [];
  const messages = await collect(client.stream.connect({ states: 'SILENT' }, { idleTimeout: 50, onReconnect: (i) => reasons.push(i.reason) }), 2);
  assert.deepEqual(messages.map((m) => m.type), ['ready', 'ready']);
  assert.equal(fake.streamConnections - before, 2);
  assert.deepEqual(reasons, ['idle']);
});

test('close() ends iteration quietly; an aborted signal throws its reason', async () => {
  const stream = client.stream.connect({ states: 'SILENT' });
  const seen = [];
  for await (const m of stream) {
    seen.push(m.type);
    stream.close();
  }
  assert.deepEqual(seen, ['ready']);
  assert.ok(stream.closed);

  const controller = new AbortController();
  await assert.rejects(async () => {
    for await (const m of client.stream.connect({ states: 'SILENT' }, { signal: controller.signal })) controller.abort(new Error('stopped'));
  }, /stopped/);
});

test('reconnect: false ends when the connection does', async () => {
  const messages = await collect(client.stream.connect({ states: 'CA' }, { reconnect: false }));
  assert.deepEqual(messages.map((m) => m.type), ['ready', 'endorsement']);
});

test('expired cursors and revoked access are errors, not retry loops', async () => {
  await assert.rejects(collect(client.stream.connect({ cursor: 'old' })), (err) => err instanceof CursorExpiredError && err.status === 410);
  await assert.rejects(collect(client.stream.connect({ states: 'REVOKED' })), (err) => err instanceof PermissionDeniedError && err.code === 'no_access');
});

test('a stream can be iterated only once', async () => {
  const stream = client.stream.connect({ states: 'SILENT' });
  await collect(stream, 1);
  assert.throws(() => stream[Symbol.asyncIterator](), /iterated once/);
});

test('events.list sends filters, cursor, wait and since', async () => {
  const since = new Date('2026-10-01T00:00:00Z');
  await client.events.list({ subscription: 'CA labor', since, wait: 0, limit: 10 });
  const req = fake.requests.at(-1);
  assert.equal(req.query.get('subscription'), 'CA labor');
  assert.equal(req.query.get('since'), '2026-10-01T00:00:00.000Z');
  assert.equal(req.query.get('limit'), '10');
  await assert.rejects(client.events.list({ cursor: 'old' }), CursorExpiredError);
});

test('events.follow pages through changes and reports the cursor', async () => {
  const cursors = [];
  const items = await collect(client.events.follow({ cursor: 'c0', limit: 2, wait: 0 }, { onCursor: (c) => cursors.push(c) }), 3);
  assert.deepEqual(items.map((i) => i.event.id), ['1', '2', '3']);
  assert.deepEqual(cursors, ['c2']);
  const firstCall = fake.requests.filter((r) => r.path === '/v1/events').at(-2);
  assert.equal(firstCall.query.get('cursor'), 'c0');
  await assert.rejects(collect(client.events.follow({ cursor: 'old' })), CursorExpiredError);
});

test('events.follow starts from "from" without a cursor, then uses the cursor', async () => {
  await collect(client.events.follow({ from: 'earliest', limit: 2, wait: 0 }), 3);
  const calls = fake.requests.filter((r) => r.path === '/v1/events').slice(-2);
  assert.equal(calls[0].query.get('from'), 'earliest');
  assert.ok(!calls[0].query.has('cursor'));
  assert.ok(!calls[1].query.has('from'));
  assert.equal(calls[1].query.get('cursor'), 'c2');
});
