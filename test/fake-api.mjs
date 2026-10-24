// A stand-in for api.ballotdata.net, so the tests run without a key or a
// network. Responses have the shapes in the API reference; the people and
// endorsers are made up (the same ones the reference uses).

import { createServer } from 'node:http';

export const KEY = 'ebk_test_secret';

const district = { id: 77, ocd_id: 'ocd-division/country:us/state:ca/county:san_francisco/council_district:8', name: 'San Francisco Supervisorial District 8', level: 'county', type: 'council', state: 'CA' };
const election = { id: 3, slug: 'ca-2026-11-03-general', name: 'California General Election', short_name: 'General Election', date: '2026-11-03', state: 'CA', type: 'general', primary_system: 'top_two', info_url: null, details: { all_mail: true } };
const labor = { slug: 'labor', name: 'Labor' };
const editorial = { slug: 'editorial', name: 'Voter guides & editorial boards' };
const laborCouncil = { id: 512, slug: 'sf-labor-council', name: 'San Francisco Labor Council', category: labor, state: 'CA' };
const chronicle = { id: 88, slug: 'sf-chronicle', name: 'San Francisco Chronicle', category: editorial, state: 'CA' };

const supervisor = {
  id: 4410, title: 'Member, Board of Supervisors, District 8', short_title: 'Supervisor, D8', kind: 'candidate',
  vote_method: 'ranked_choice', votes_allowed: 1, ranks_allowed: 10, measure_code: null, description: null, ballot_order: 41,
  party: null, details: { nonpartisan: true }, source_url: null, district, election,
};
const prop = {
  id: 9031, title: 'Proposition 5', short_title: 'Prop 5', kind: 'measure', vote_method: 'yes_no', votes_allowed: 1,
  ranks_allowed: null, measure_code: '5', description: 'Shall the measure…?', ballot_order: 12, party: null, details: {},
  source_url: null, district: { ...district, id: 6, name: 'California', level: 'state', type: 'statewide' }, election,
};
const choice = (id, label, extra = {}) => ({
  id, label, measure_answer: null, option: null, ballot_designation: null, withdrawn: false,
  candidate: { id: id + 1000, full_name: label, website_url: null, photo_url: null }, party: null, party_label: null, ...extra,
});
const jane = choice(20931, 'Jane Doe', { ballot_designation: 'Transit Planner' });
const sam = choice(20932, 'Sam Rivera');
const yes = { ...choice(51001, 'Yes'), measure_answer: 'yes', candidate: null };
const no = { ...choice(51002, 'No'), measure_answer: 'no', candidate: null };

const endorsement = (id, endorser, contest, c, rank = null) => ({
  id, rank, statement: null, source_url: null, published_on: '2026-09-18', endorser, contest,
  choice: { id: c.id, label: c.label, measure_answer: c.measure_answer, option: null, withdrawn: false, candidate: c.candidate && { id: c.candidate.id, full_name: c.candidate.full_name }, party: null, party_label: null },
});
export const ENDORSEMENTS = [
  endorsement(90211, laborCouncil, supervisor, jane, 1),
  endorsement(90212, laborCouncil, supervisor, sam, 2),
  endorsement(90213, chronicle, supervisor, sam),
  endorsement(90214, laborCouncil, prop, yes),
];

export const event = (id, type = 'endorsement.created') => ({
  id: String(id), type, occurred_at: '2026-10-14T21:07:33.512Z',
  endorsement: { id: 90211, rank: 1, statement: null, source_url: null, published_on: '2026-09-18' },
  endorser: laborCouncil,
  contest: { id: 4410, title: supervisor.title, short_title: supervisor.short_title, kind: 'candidate', vote_method: 'ranked_choice', votes_allowed: 1, ranks_allowed: 10, measure_code: null, district: { id: 77, name: district.name, level: 'county', ocd_id: district.ocd_id, state: 'CA' } },
  election: { id: 3, slug: election.slug, name: election.name, date: election.date, state: 'CA', type: 'general' },
  choice: { id: 20931, label: 'Jane Doe', measure_answer: null, candidate: { id: 8811, full_name: 'Jane Doe' }, party: null, withdrawn: false },
});

const page = (items, url, size) => {
  const start = Number(url.searchParams.get('cursor') ?? 0);
  const limit = Number(url.searchParams.get('limit') ?? size);
  const next = start + limit < items.length ? String(start + limit) : null;
  return { data: items.slice(start, start + limit), next_cursor: next };
};

/**
 * Start the fake API on a free port.
 * @param {object} [options]
 * @param {number} [options.rateLimitFirst] answer this many requests with 429 first
 * @returns {Promise<{ url: string, requests: { method: string, path: string, query: URLSearchParams, headers: object, body: string }[], close: () => Promise<void> }>}
 */
export async function startFakeApi({ rateLimitFirst = 0, failFirst = 0 } = {}) {
  const requests = [];
  let limited = 0;
  let failed = 0;
  let streamConnections = 0;
  const subscriptions = [];

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ method: req.method, path: url.pathname, query: url.searchParams, headers: req.headers, body });

    const send = (status, json, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'X-Request-Id': 'req-1', ...headers });
      res.end(json === undefined ? undefined : JSON.stringify(json));
    };
    const error = (status, code, message, headers) => send(status, { error: { code, message, request_id: 'req-1' } }, headers);

    if (req.headers.authorization !== `Bearer ${KEY}`) return error(401, 'invalid_api_key', 'That API key is not valid.');
    if (limited < rateLimitFirst) {
      limited++;
      return error(429, 'rate_limit_exceeded', 'Your plan allows 60 requests a minute.', { 'Retry-After': '0.01' });
    }

    if (failed < failFirst) {
      failed++;
      return error(502, 'http_error', 'Bad gateway');
    }

    const p = url.pathname;
    if (p === '/v1/slow') return setTimeout(() => send(200, { data: [] }), 300);
    if (p === '/v1/states') return send(200, { data: [{ code: 'CA', fips: '06', name: 'California' }] });
    if (p === '/v1/coverage') return send(200, { data: [{ state: 'CA', name: 'California', election_count: 1, contest_count: 2, measure_count: 1, endorser_count: 2, endorsement_count: 4, endorsed_contest_count: 2, first_election: '2026-11-03', last_election: '2026-11-03', updated_at: null }] }, { 'RateLimit-Limit': '60', 'RateLimit-Remaining': '59', 'RateLimit-Reset': '30' });
    if (p === '/v1/officeholders') return send(200, { data: [{ person_id: 'p-1', name: 'Alex Morgan', office: 'state_representative', state: 'CA' }], next_cursor: null });
    if (p === '/v1/officeholders/p-1') return send(200, { data: { person_id: 'p-1', name: 'Alex Morgan', seats: [] } });
    if (p === '/v1/officeholders/missing') return error(404, 'not_found', 'No officeholder has that id.');
    if (p === '/v1/busy' && req.method === 'POST') return error(503, 'warming_up', 'Warming up.', { 'Retry-After': '0' });
    if (p === '/v1/elections') return send(200, { data: [{ ...election, contest_count: 2, endorsement_count: 4 }], next_cursor: null });
    if (p === '/v1/endorser-categories') return send(200, { data: [{ slug: 'labor', name: 'Labor', singular_name: 'Labor union', endorser_count: 1 }] });
    if (p === '/v1/endorsers') return send(200, { data: [{ ...laborCouncil, description: null, website_url: 'https://sflaborcouncil.org', logo_url: null, party: null, endorsement_count: 3 }], next_cursor: null });
    if (p === '/v1/endorsers/sf-labor-council') {
      return send(200, { data: { ...laborCouncil, description: null, website_url: 'https://sflaborcouncil.org', logo_url: null, party: null, elections: [{ election: election.slug, name: election.name, date: election.date, contests: 2 }] } });
    }
    if (p === '/v1/contests') return send(200, page([{ ...supervisor, choices: [jane, sam] }, { ...prop, choices: [yes, no] }], url, 50));
    if (p === '/v1/contests/4410') {
      return send(200, {
        data: {
          ...supervisor,
          choices: [jane, sam],
          endorsements: [
            { endorser: laborCouncil, picks: [{ choice_id: 20932, label: 'Sam Rivera', measure_answer: null, rank: 2 }, { choice_id: 20931, label: 'Jane Doe', measure_answer: null, rank: 1 }] },
            { endorser: chronicle, picks: [{ choice_id: 20932, label: 'Sam Rivera', measure_answer: null, rank: null }] },
          ],
        },
      });
    }
    if (p === '/v1/endorsements') {
      const endorser = url.searchParams.get('endorsers');
      return send(200, page(endorser ? ENDORSEMENTS.filter((e) => e.endorser.slug === endorser) : ENDORSEMENTS, url, 100));
    }
    if (p === '/v1/events') {
      // Cursor "c<n>": events after n. Three events exist: 1, 2, 3.
      const after = Number((url.searchParams.get('cursor') ?? 'c0').slice(1));
      if (url.searchParams.has('since') || url.searchParams.has('from')) requests.at(-1).start = url.searchParams.get('since') ?? url.searchParams.get('from');
      if (url.searchParams.get('cursor') === 'old') return error(410, 'cursor_expired', 'That position is older than the stream keeps.');
      const limit = Number(url.searchParams.get('limit') ?? 100);
      const ids = [1, 2, 3].filter((n) => n > after).slice(0, limit);
      const last = ids.at(-1) ?? after;
      return send(200, { data: ids.map((n) => event(n)), next_cursor: `c${last}`, has_more: last < 3 });
    }
    if (p === '/v1/stream') {
      streamConnections++;
      const lastId = req.headers['last-event-id'];
      if (lastId === 'old') return error(410, 'cursor_expired', 'That position is older than the stream keeps.');
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write('retry: 10\n\n');
      res.write(`id: ${lastId ?? 'c0'}\nevent: ready\ndata: {"subscription":"inline"}\n\n`);
      if (url.searchParams.get('states') === 'SILENT') return; // a connection that goes quiet
      if (url.searchParams.get('states') === 'REVOKED') return res.end('event: error\ndata: {"code":"no_access"}\n\n');
      if (!lastId) {
        // First connection: one event split across writes, a heartbeat, then the hourly reconnect.
        const data = JSON.stringify(event(1));
        res.write(`id: c1\nevent: endorsement\ndata: ${data.slice(0, 20)}`);
        await new Promise((r) => setTimeout(r, 5));
        res.write(`${data.slice(20)}\n\n: ping\n\n`);
        res.write('id: c5\nevent: checkpoint\ndata: {}\n\n');
        res.end('event: reconnect\ndata: {}\n\n');
      } else {
        // Reconnected: continue after the checkpoint, then drop without warning.
        res.end(`id: c6\nevent: endorsement\ndata: ${JSON.stringify(event(6, 'endorsement.deleted'))}\n\n`);
      }
      return;
    }
    if (p === '/v1/subscriptions' && req.method === 'GET') return send(200, { data: subscriptions });
    if (p === '/v1/subscriptions' && req.method === 'POST') {
      const input = JSON.parse(body);
      const sub = { id: subscriptions.length + 7, name: input.name, filter: input.filter ?? {}, created_at: 'now', updated_at: 'now' };
      if (subscriptions.some((x) => x.name === sub.name)) return error(409, 'conflict', 'A subscription with that name already exists.');
      subscriptions.push(sub);
      return send(201, { data: sub });
    }
    const subMatch = p.match(/^\/v1\/subscriptions\/(\d+)$/);
    if (subMatch) {
      const i = subscriptions.findIndex((s) => s.id === Number(subMatch[1]));
      if (i < 0) return error(404, 'subscription_not_found', 'No subscription has that id or name.');
      if (req.method === 'GET') return send(200, { data: subscriptions[i] });
      if (req.method === 'DELETE') {
        subscriptions.splice(i, 1);
        return send(204);
      }
      if (req.method === 'PUT') {
        const input = JSON.parse(body);
        subscriptions[i] = { ...subscriptions[i], name: input.name, filter: input.filter ?? {} };
        return send(200, { data: subscriptions[i] });
      }
    }
    return error(404, 'not_found', 'Not found.');
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    requests,
    get streamConnections() {
      return streamConnections;
    },
    close: () => new Promise((resolve) => {
      server.closeAllConnections();
      server.close(resolve);
    }),
  };
}
