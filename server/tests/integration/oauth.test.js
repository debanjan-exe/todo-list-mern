// Integration test: the full OAuth "Connect" flow, step by step, like Claude does it.
// Real Express app over HTTP; only the data layer is in memory.
import crypto from 'crypto';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { db, resetDb } from '../helpers/memoryData.js';

vi.mock('../../src/data/userData.js', async () => (await import('../helpers/memoryData.js')).userData);
vi.mock('../../src/data/taskData.js', async () => (await import('../helpers/memoryData.js')).taskData);
vi.mock('../../src/data/tokenData.js', async () => (await import('../helpers/memoryData.js')).tokenData);

process.env.APP_URL = 'https://todo.example.app';
const { default: app } = await import('../../src/app.js');

const REDIRECT = 'https://claude.ai/api/mcp/auth_callback';
let server;
let base;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server.close());
beforeEach(() => resetDb());

const json = async (res) => ({ status: res.status, body: await res.json().catch(() => ({})), headers: res.headers });
const post = (path, body, token) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  }).then(json);
const get = (path, token) => fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {}, redirect: 'manual' }).then(json);

// PKCE pair, as the client makes it
const verifier = crypto.randomBytes(32).toString('base64url');
const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

async function signUp() {
  return (await post('/api/auth/signup', { name: 'Asha', email: 'asha@mail.com', password: 'secret1' })).body.token;
}

function authorizeQuery(clientId, extra = {}) {
  return new URLSearchParams({
    response_type: 'code', client_id: clientId, redirect_uri: REDIRECT,
    code_challenge: challenge, code_challenge_method: 'S256', state: 'xyz', ...extra,
  }).toString();
}

// Steps 1-3: register, authorize, user taps Allow -> code
async function getCode(session) {
  const client = (await post('/oauth/register', { client_name: 'Claude', redirect_uris: [REDIRECT] })).body;
  const query = authorizeQuery(client.client_id);
  const approved = await post('/api/oauth/authorize', Object.fromEntries(new URLSearchParams(query)), session);
  return { clientId: client.client_id, redirectUrl: approved.body.redirectUrl, code: new URL(approved.body.redirectUrl).searchParams.get('code') };
}

// Step 4: form post, like Claude
const exchange = (fields) =>
  fetch(`${base}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  }).then(json);

describe('OAuth discovery', () => {
  it('/mcp without a token says where to sign in', async () => {
    const res = await fetch(`${base}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toBe(`Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"`);
  });

  it('publishes the resource and server metadata', async () => {
    const resource = (await get('/.well-known/oauth-protected-resource/mcp')).body;
    expect(resource).toMatchObject({ resource: `${base}/mcp`, authorization_servers: [base] });

    const meta = (await get('/.well-known/oauth-authorization-server')).body;
    expect(meta).toMatchObject({
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      registration_endpoint: `${base}/oauth/register`,
      code_challenge_methods_supported: ['S256'],
    });
  });
});

describe('OAuth connect flow', () => {
  it('register -> authorize -> Allow -> token -> MCP works', async () => {
    const session = await signUp();

    // 1. register
    const reg = await post('/oauth/register', { client_name: 'Claude', redirect_uris: [REDIRECT] });
    expect(reg.status).toBe(201);

    // 2. authorize -> redirect to the app's consent page with the same query
    const query = authorizeQuery(reg.body.client_id);
    const auth = await get(`/oauth/authorize?${query}`);
    expect(auth.status).toBe(302);
    expect(auth.headers.get('location')).toBe(`https://todo.example.app/oauth/authorize?${query}`);

    // consent page asks who it is
    const info = await get(`/api/oauth/authorize/info?${query}`, session);
    expect(info.body.clientName).toBe('Claude');
    expect(info.body.denyUrl).toBe(`${REDIRECT}?error=access_denied&state=xyz`);

    // 3. Allow -> code back to Claude, with the state
    const approved = await post('/api/oauth/authorize', Object.fromEntries(new URLSearchParams(query)), session);
    const redirectUrl = new URL(approved.body.redirectUrl);
    expect(`${redirectUrl.origin}${redirectUrl.pathname}`).toBe(REDIRECT);
    expect(redirectUrl.searchParams.get('state')).toBe('xyz');
    const code = redirectUrl.searchParams.get('code');

    // 4. token
    const tok = await exchange({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: reg.body.client_id, redirect_uri: REDIRECT });
    expect(tok.status).toBe(200);
    expect(tok.body).toMatchObject({ token_type: 'Bearer' });
    expect(tok.body.access_token).toMatch(/^todo_pat_/);

    // The token works on /mcp and shows in the Profile list as an OAuth token
    const client = new Client({ name: 't', version: '1' });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
      requestInit: { headers: { Authorization: `Bearer ${tok.body.access_token}` } },
    }));
    expect((await client.listTools()).tools).toHaveLength(8);
    await client.close();

    const list = (await get('/api/tokens', session)).body;
    expect(list).toEqual([expect.objectContaining({ name: 'Claude', viaOAuth: true })]);
  });

  it('connecting the same client again replaces its old token', async () => {
    const session = await signUp();
    const first = await getCode(session);
    const a = await exchange({ grant_type: 'authorization_code', code: first.code, code_verifier: verifier, client_id: first.clientId, redirect_uri: REDIRECT });

    const query = Object.fromEntries(new URLSearchParams(authorizeQuery(first.clientId)));
    const again = new URL((await post('/api/oauth/authorize', query, session)).body.redirectUrl).searchParams.get('code');
    const b = await exchange({ grant_type: 'authorization_code', code: again, code_verifier: verifier, client_id: first.clientId, redirect_uri: REDIRECT });

    expect((await get('/api/tasks', a.body.access_token)).status).toBe(401);
    expect((await get('/api/tasks', b.body.access_token)).status).toBe(200);
  });

  it('refuses a wrong PKCE verifier, another client and an untrusted redirect URI', async () => {
    const session = await signUp();
    const { code, clientId } = await getCode(session);

    const wrong = await exchange({ grant_type: 'authorization_code', code, code_verifier: 'nope', client_id: clientId, redirect_uri: REDIRECT });
    expect(wrong.body.error).toBe('invalid_grant');

    const other = (await post('/oauth/register', { redirect_uris: [REDIRECT] })).body.client_id;
    const stolen = await exchange({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: other, redirect_uri: REDIRECT });
    expect(stolen.body.error).toBe('invalid_grant');

    const evil = await post('/oauth/register', { redirect_uris: ['https://evil.example.com/cb'] });
    expect(evil.body.error).toBe('invalid_redirect_uri');

    const bad = await get(`/oauth/authorize?${authorizeQuery(clientId, { redirect_uri: 'https://claude.ai/other' })}`);
    expect(bad.status).toBe(400);
  });

  it('only the signed-in app can approve (not an access token, not signed out)', async () => {
    const session = await signUp();
    const { code, clientId } = await getCode(session);
    const tok = (await exchange({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: clientId, redirect_uri: REDIRECT })).body;
    const query = Object.fromEntries(new URLSearchParams(authorizeQuery(clientId)));

    expect((await post('/api/oauth/authorize', query, tok.access_token)).status).toBe(403);
    expect((await post('/api/oauth/authorize', query)).status).toBe(401);
    expect(db.tokens.filter((t) => !t.isDeleted)).toHaveLength(1);
  });
});
