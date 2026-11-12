// Unit tests for api.js: token handling, headers and errors.
// fetch is replaced with a mock, so no server is needed.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../src/api';

// Make fetch answer with this status and JSON body
function mockFetch(status, body) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('token', () => {
  it('saves, reads and clears the token', () => {
    api.saveToken('abc');
    expect(api.getToken()).toBe('abc');
    api.clearToken();
    expect(api.getToken()).toBeNull();
  });
});

describe('requests', () => {
  it('sends "Authorization: Bearer <token>" when signed in', async () => {
    api.saveToken('my-token');
    const fetchMock = mockFetch(200, []);
    await api.getTasks();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/tasks$/);
    expect(options.headers.Authorization).toBe('Bearer my-token');
  });

  it('sends no Authorization header when signed out', async () => {
    const fetchMock = mockFetch(200, []);
    await api.getTasks();
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('sends JSON for POST and encodes the search text', async () => {
    const fetchMock = mockFetch(201, {});
    await api.createTask({ title: 'A' });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{"title":"A"}' });

    await api.searchTasks('a & b');
    expect(fetchMock.mock.calls[1][0]).toContain('search=a%20%26%20b');
  });

  it('throws an error with the server message and status', async () => {
    mockFetch(404, { message: 'Task not found' });
    await expect(api.deleteTask('x')).rejects.toMatchObject({ message: 'Task not found', status: 404 });
  });

  it('calls the sign-out handler on 401 when a token was sent', async () => {
    const onUnauthorized = vi.fn();
    api.setUnauthorizedHandler(onUnauthorized);
    api.saveToken('expired');
    mockFetch(401, { message: 'Session expired' });
    await expect(api.getTasks()).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it('does NOT call the sign-out handler for a wrong password (no token yet)', async () => {
    const onUnauthorized = vi.fn();
    api.setUnauthorizedHandler(onUnauthorized);
    mockFetch(401, { message: 'Email or password is wrong' });
    await expect(api.signIn('a@b.com', 'x')).rejects.toThrow('Email or password is wrong');
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('getHealth', () => {
  it('returns the status even when the server answers 503', async () => {
    mockFetch(503, { status: 'error' });
    await expect(api.getHealth()).resolves.toEqual({ status: 'error' });
  });
});
