# The Endorsement Stream

The stream tells you about every endorsement that is added, changed or removed, within seconds. This
guide shows how to build a copy of the data that stays current.

## The pattern

1. **Sync** what you need with `client.endorsements.list()`.
2. **Follow** changes from then on with `client.stream.connect()` (or `client.events` where a
   connection can't stay open).
3. **Save the cursor** after each change you've handled.
4. On restart, **resume** from the saved cursor.
5. If the cursor has **expired**, go back to step 1.

```js
import { BallotData, CursorExpiredError } from 'ballotdata';

const client = new BallotData();
const filter = { states: ['CA'], categories: ['labor', 'editorial'] };

async function sync() {
  for await (const e of client.endorsements.list({ ...filter, upcoming: true, limit: 500 })) {
    await db.upsertEndorsement(e);
  }
}

async function follow() {
  let cursor = await db.getCursor();
  if (!cursor) await sync(); // first run

  const stream = client.stream.connect(
    { ...filter, ...(cursor ? { cursor } : { from: 'latest' }) },
    { onCursor: (c) => db.setCursor(c) },
  );
  for await (const message of stream) {
    if (message.type !== 'endorsement') continue;
    const { event } = message;
    if (event.type === 'endorsement.deleted') await db.deleteEndorsement(event.endorsement.id);
    else await db.upsertFromEvent(event);
  }
}

for (;;) {
  try {
    await follow();
  } catch (err) {
    if (!(err instanceof CursorExpiredError)) throw err;
    await db.setCursor(null); // too far behind: sync again
  }
}
```

There is a small window between the sync finishing and the stream starting at `latest`. Close it by
starting the stream with `since` set to when the sync began, and dropping repeats by `event.id`:

```js
const started = new Date();
await sync();
client.stream.connect({ ...filter, since: started }, { onCursor: save });
```

## Events

Each `EndorsementEvent` has:

- `id`: unique and increasing. Use it to drop repeats.
- `type`: `endorsement.created`, `endorsement.updated` or `endorsement.deleted`.
- `occurred_at`: when the change was made.
- `endorsement`: `{ id, rank, statement, source_url, published_on }`.
- `endorser`, `contest` (with its `district`), `election` and `choice`, enough to show the change
  without another request. Call `client.contests.get(event.contest.id)` for the full contest.

## Cursors

A cursor is an opaque string marking a position in the stream. The stream gives you a new one after
every event, and also on **checkpoints**, which move your position past changes your filter didn't
match. `onCursor` is called for both, so saving in `onCursor` always keeps the newest position.

Where to start when there's no cursor:

| Parameter | Starts at |
| --- | --- |
| `from: 'latest'` (default) | Changes from now on. |
| `from: 'earliest'` | The oldest change the stream still keeps. |
| `since: date` | Changes from that time on, within what the stream keeps. |

A cursor, or a `since`, older than the stream keeps throws `CursorExpiredError`.

## Reconnecting

The library reconnects for you, sending the cursor as `Last-Event-ID`:

| Why | What happens |
| --- | --- |
| The API's hourly `reconnect` | Reconnects at once. This spreads load after deploys. |
| The connection drops | Reconnects after the API's `retry` delay (5 s), backing off on repeated failures up to `maxReconnectDelay`. |
| Silence for `idleTimeout` (60 s) | The API writes at least every 20 s, so a silent connection is dead. It is dropped and reopened. |
| 429 (too many streams) or 503 (busy, warming up) | Waits `Retry-After`, then tries again. |
| The API can't be reached | Backs off and tries again. |

`onReconnect` tells you each time: `{ attempt, delayMs, reason, error? }`.

Errors a retry can't fix end the loop: `AuthenticationError`, `PermissionDeniedError` (for example
`no_access` when the purchase ends; the API re-checks access every 30 seconds),
`NotFoundError` (`subscription_not_found`), `BadRequestError`, and `CursorExpiredError`.

Turn reconnecting off with `reconnect: false`; the loop then ends when the connection does.

## Stopping

```js
const stream = client.stream.connect(filter);
process.on('SIGTERM', () => stream.close()); // the for await loop ends normally

// or with a signal, which makes the loop throw the signal's reason
const controller = new AbortController();
client.stream.connect(filter, { signal: controller.signal });
```

## Limits

- Each open stream counts against your plan's open-stream limit. Opening one beyond it answers
  429 `too_many_streams`, which the library waits out and retries.
- Opening a stream counts as one request against your rate limit.
- Read the stream from a server. Browsers' `EventSource` can't send the API key, and keys must
  never reach a browser.

## Serverless and cron: polling

Where a process can't hold a connection open, poll `GET /v1/events` instead. It returns the same
events, a page at a time.

```js
// A cron job: fetch everything new, save the cursor, exit.
let cursor = await db.getCursor();
for (;;) {
  const page = await client.events.list({ subscription: 'CA labor', ...(cursor ? { cursor } : { from: 'latest' }), limit: 1000 });
  for (const event of page.data) await handle(event);
  cursor = page.next_cursor;
  await db.setCursor(cursor);
  if (!page.has_more) break;
}
```

```js
// A long-running poller: each request waits up to 20 seconds for something new.
for await (const { event, cursor } of client.events.follow({ states: 'CA', cursor: await db.getCursor() })) {
  await handle(event);
  await db.setCursor(cursor);
}
```

## Postbacks

If you'd rather not hold a connection or poll at all, BallotData can POST changes to your HTTPS
endpoint. See the [postbacks guide](postbacks.md).
