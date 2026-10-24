import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { PostbackSignatureError, constructPostback, signPostback, verifyPostbackSignature } from '../dist/esm/index.js';

const body = JSON.stringify({ delivery_id: 42, sent_at: '2026-10-16T14:02:11.000Z', changes: [{ id: '88123', type: 'endorsement.created' }] });
const now = 1_760_620_800;

test('signatures match the documented HMAC (t + "." + raw body, hex SHA-256)', async () => {
  const expected = createHmac('sha256', 'shh').update(`${now}.${body}`).digest('hex');
  assert.equal(await signPostback(body, 'shh', now), `t=${now},v1=${expected}`);
});

test('verifyPostbackSignature accepts good signatures and refuses bad ones', async () => {
  const header = await signPostback(body, 'shh', now);
  assert.equal(await verifyPostbackSignature(body, header, 'shh', { now }), true);
  assert.equal(await verifyPostbackSignature(Buffer.from(body), header, 'shh', { now: now + 299 }), true);
  assert.equal(await verifyPostbackSignature(new TextEncoder().encode(body).buffer, header, 'shh', { now }), true);
  assert.equal(await verifyPostbackSignature(body, header.toUpperCase().replace('T=', 't=').replace('V1=', 'v1='), 'shh', { now }), true);
  assert.equal(await verifyPostbackSignature(body, header, 'other', { now }), false);
  assert.equal(await verifyPostbackSignature(`${body} `, header, 'shh', { now }), false);
  assert.equal(await verifyPostbackSignature(body, header, 'shh', { now: now + 301 }), false);
  assert.equal(await verifyPostbackSignature(body, header, 'shh', { now: now + 1000, tolerance: 2000 }), true);
  assert.equal(await verifyPostbackSignature(body, undefined, 'shh', { now }), false);
  assert.equal(await verifyPostbackSignature(body, 't=abc,v1=00', 'shh', { now }), false);
  assert.equal(await verifyPostbackSignature(body, `t=${now}`, 'shh', { now }), false);
});

test('a header with several v1 values matches if any does (secret rotation)', async () => {
  const good = (await signPostback(body, 'new', now)).split('v1=')[1];
  assert.equal(await verifyPostbackSignature(body, `t=${now},v1=${'0'.repeat(64)},v1=${good}`, 'new', { now }), true);
});

test('constructPostback parses a signed body and throws on a bad one', async () => {
  const header = await signPostback(body, 'shh', now);
  const postback = await constructPostback(Buffer.from(body), header, 'shh', { now });
  assert.equal(postback.delivery_id, 42);
  assert.equal(postback.changes[0].id, '88123');
  await assert.rejects(constructPostback(body, header, 'wrong', { now }), PostbackSignatureError);
  await assert.rejects(constructPostback(body, null, 'shh', { now }), /No BallotData-Signature header/);
});
