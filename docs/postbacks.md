# Postbacks

With postbacks, BallotData POSTs each batch of endorsement changes to your HTTPS endpoint as JSON.
Set the endpoint at checkout or in your [ballotdata.net account](https://ballotdata.net/account),
where the signing secret is shown.

## The request

```http
POST https://your-server.example/ballotdata
Content-Type: application/json
BallotData-Signature: t=1760620800,v1=5f2b…

{ "delivery_id": 42, "sent_at": "2026-10-16T14:02:11.000Z", "changes": [ { "id": "88123", "type": "endorsement.created", … } ] }
```

Each item in `changes` is an `EndorsementEvent`, the same shape the stream yields.

- Answer with any 2xx within 15 seconds. Anything else, or no answer, is retried with growing gaps
  of up to an hour. Redirects aren't followed.
- A change can arrive twice after a retry. Use its `id` to drop repeats.
- Do slow work after answering, for example by putting the changes on a queue.

## Checking the signature

`BallotData-Signature` holds a timestamp `t` and `v1`, the hex HMAC-SHA256 of `t`, a dot, and the
raw body, keyed with your signing secret. Refuse requests whose signature doesn't match or whose
timestamp is more than five minutes off. The library does both:

```js
import { constructPostback, verifyPostbackSignature } from 'ballotdata';

const postback = await constructPostback(rawBody, signatureHeader, secret); // throws PostbackSignatureError
const ok = await verifyPostbackSignature(rawBody, signatureHeader, secret); // true or false
```

Always pass the **raw** body. A body that was parsed and re-serialized has different bytes and won't
match.

## Express

```js
import express from 'express';
import { constructPostback, PostbackSignatureError } from 'ballotdata';

const app = express();
app.post('/ballotdata', express.raw({ type: 'application/json' }), async (req, res) => {
  let postback;
  try {
    postback = await constructPostback(req.body, req.get('BallotData-Signature'), process.env.BALLOTDATA_SIGNING_SECRET);
  } catch (err) {
    if (err instanceof PostbackSignatureError) return res.sendStatus(401);
    throw err;
  }
  res.sendStatus(204);
  await queue.push(postback.changes);
});
```

## Next.js route handler

```js
// app/api/ballotdata/route.js
import { constructPostback, PostbackSignatureError } from 'ballotdata';

export async function POST(request) {
  const raw = await request.text();
  try {
    const postback = await constructPostback(raw, request.headers.get('BallotData-Signature'), process.env.BALLOTDATA_SIGNING_SECRET);
    await queue.push(postback.changes);
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof PostbackSignatureError) return new Response('bad signature', { status: 401 });
    throw err;
  }
}
```

## Cloudflare Workers

```js
import { constructPostback, PostbackSignatureError } from 'ballotdata';

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    try {
      const postback = await constructPostback(await request.text(), request.headers.get('BallotData-Signature'), env.BALLOTDATA_SIGNING_SECRET);
      ctx.waitUntil(env.CHANGES.send(postback.changes));
      return new Response(null, { status: 204 });
    } catch (err) {
      if (err instanceof PostbackSignatureError) return new Response(null, { status: 401 });
      throw err;
    }
  },
};
```

## Plain Node

```js
import { createServer } from 'node:http';
import { verifyPostbackSignature } from 'ballotdata';

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks);
  if (!(await verifyPostbackSignature(raw, req.headers['ballotdata-signature'], process.env.BALLOTDATA_SIGNING_SECRET))) {
    return res.writeHead(401).end();
  }
  const { changes } = JSON.parse(raw.toString('utf8'));
  res.writeHead(204).end();
  for (const change of changes) await handle(change);
}).listen(8080);
```

## Testing your endpoint

`signPostback` makes a header the way BallotData does:

```js
import { signPostback } from 'ballotdata';

const body = JSON.stringify({ delivery_id: 1, sent_at: new Date().toISOString(), changes: [] });
await fetch('http://localhost:8080/ballotdata', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'BallotData-Signature': await signPostback(body, secret) },
  body,
});
```
