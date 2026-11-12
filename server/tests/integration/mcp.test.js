// Integration test: the real Express app + the official MCP SDK client over HTTP.
// Only the DATA layer is replaced (in-memory), so this checks routes, auth,
// access tokens, the MCP transport and every tool together.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { db, resetDb } from '../helpers/memoryData.js';

vi.mock('../../src/data/userData.js', async () => (await import('../helpers/memoryData.js')).userData);
vi.mock('../../src/data/taskData.js', async () => (await import('../helpers/memoryData.js')).taskData);
vi.mock('../../src/data/tokenData.js', async () => (await import('../helpers/memoryData.js')).tokenData);

const { default: app } = await import('../../src/app.js');

let server;
let baseUrl;

beforeAll(async () => {
  server = app.listen(0); // any free port
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server.close());
beforeEach(() => resetDb());

// ---- helpers ----
async function api(method, path, { token, body } = {}) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// Sign up a user and make a personal access token for them
async function userWithAccessToken(email = 'asha@mail.com') {
  const signup = await api('POST', '/api/auth/signup', { body: { name: 'Asha', email, password: 'secret1' } });
  const created = await api('POST', '/api/tokens', { token: signup.body.token, body: { name: 'Claude' } });
  return { session: signup.body.token, accessToken: created.body.token, tokenId: created.body.id };
}

async function mcpClient(accessToken) {
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`), {
    requestInit: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  await client.connect(transport);
  return client;
}

// Call a tool and read its JSON text answer
async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content[0].text;
  return { isError: !!result.isError, text, data: result.isError ? null : JSON.parse(text) };
}

const thisWeek = { from: '2026-11-09T00:00:00+05:30', to: '2026-11-15T23:59:59+05:30' };

// ---- tests ----
describe('personal access tokens', () => {
  it('shows the full token only once and stores only a hash', async () => {
    const { session, accessToken } = await userWithAccessToken();
    expect(accessToken).toMatch(/^todo_pat_/);
    expect(db.tokens[0].tokenHash).not.toContain(accessToken);

    const list = await api('GET', '/api/tokens', { token: session });
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).not.toHaveProperty('token');
    expect(list.body[0]).not.toHaveProperty('tokenHash');
  });

  it('cannot be used to manage tokens (only the app can)', async () => {
    const { accessToken } = await userWithAccessToken();
    const res = await api('POST', '/api/tokens', { token: accessToken, body: { name: 'More' } });
    expect(res.status).toBe(403);
  });

  it('stops working at once when revoked (soft delete)', async () => {
    const { session, accessToken, tokenId } = await userWithAccessToken();
    expect((await api('GET', '/api/tasks', { token: accessToken })).status).toBe(200);

    expect((await api('DELETE', `/api/tokens/${tokenId}`, { token: session })).status).toBe(200);
    expect((await api('GET', '/api/tasks', { token: accessToken })).status).toBe(401);
    expect(db.tokens[0].isDeleted).toBe(true); // still in the database
  });
});

describe('/mcp', () => {
  it('needs a token', async () => {
    const res = await fetch(`${baseUrl}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(res.status).toBe(401);
  });

  it('lists the 8 task tools', async () => {
    const client = await mcpClient((await userWithAccessToken()).accessToken);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'complete_task', 'create_task', 'delete_task', 'get_profile',
      'list_tasks', 'search_tasks', 'update_task', 'weekly_summary',
    ]);
    expect(tools.find((t) => t.name === 'delete_task').annotations.destructiveHint).toBe(true);
    await client.close();
  });

  it('creates, lists, completes, summarizes and deletes tasks', async () => {
    const client = await mcpClient((await userWithAccessToken()).accessToken);

    const created = await call(client, 'create_task', {
      title: 'Prepare slides', dateTime: '2026-11-12T15:00:00+05:30', endTime: '16:00', priority: 'High',
    });
    expect(created.data).toMatchObject({ title: 'Prepare slides', priority: 'High', status: 'In Progress' });
    await call(client, 'create_task', { title: 'Gym', dateTime: '2026-11-13T07:00:00+05:30' });
    await call(client, 'create_task', { title: 'Next week task', dateTime: '2026-11-17T09:00:00+05:30' });

    const week = await call(client, 'list_tasks', thisWeek);
    expect(week.data.map((t) => t.title)).toEqual(['Prepare slides', 'Gym']); // date range works

    const done = await call(client, 'complete_task', { id: created.data.id });
    expect(done.data.status).toBe('Completed');

    const found = await call(client, 'search_tasks', { query: 'SLIDES' });
    expect(found.data).toHaveLength(1);

    const summary = await call(client, 'weekly_summary', thisWeek);
    expect(summary.data).toMatchObject({ total: 2, completed: 1, open: 1, completionRate: 50 });

    const deleted = await call(client, 'delete_task', { id: created.data.id });
    expect(deleted.data).toEqual({ deleted: true, id: created.data.id });
    expect(db.tasks.find((t) => t.title === 'Prepare slides').isDeleted).toBe(true); // soft delete
    expect((await call(client, 'list_tasks', thisWeek)).data).toHaveLength(1);

    await client.close();
  });

  it('returns a clear tool error the model can fix', async () => {
    const client = await mcpClient((await userWithAccessToken()).accessToken);
    const missing = await call(client, 'complete_task', { id: '64b000000000000000000001' });
    expect(missing).toMatchObject({ isError: true, text: 'Error: Task not found' });
    await client.close();
  });

  it('never shows or changes another user\'s tasks', async () => {
    const asha = await mcpClient((await userWithAccessToken('asha@mail.com')).accessToken);
    const ben = await mcpClient((await userWithAccessToken('ben@mail.com')).accessToken);

    const task = await call(asha, 'create_task', { title: 'Asha only', dateTime: '2026-11-12T09:00:00+05:30' });

    expect((await call(ben, 'list_tasks', {})).data).toEqual([]);
    expect((await call(ben, 'complete_task', { id: task.data.id })).isError).toBe(true);
    expect((await call(ben, 'delete_task', { id: task.data.id })).isError).toBe(true);
    expect(db.tasks[0]).toMatchObject({ status: 'In Progress', isDeleted: false });

    await asha.close();
    await ben.close();
  });

  it('get_profile returns the token owner', async () => {
    const client = await mcpClient((await userWithAccessToken()).accessToken);
    expect((await call(client, 'get_profile')).data).toMatchObject({ name: 'Asha', email: 'asha@mail.com' });
    await client.close();
  });
});
