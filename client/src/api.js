// All calls to the backend are in this file.
// The API URL comes from the .env file (VITE_API_URL).
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ---- Login token ----
// The token is kept in localStorage, so the user stays signed in after a page reload.
const TOKEN_KEY = 'todo_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// AuthContext sets this. It runs when the server says 401 (token missing / expired).
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

// Small helper: call fetch with the token, turn the reply into JSON, throw if the server sent an error.
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }), // send the token if we have one
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized(); // signed-in session is no longer valid -> sign out
  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = res.status; // for example 401, 404, 503
    throw error;
  }
  return data;
}

// ---- Server status (loading screen) ----
// Returns the status even when the server answers 503 (some part is down).
// Throws only when the server cannot be reached at all.
export async function getHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

// ---- Auth ----
export const signUp = (name, email, password) =>
  request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });

export const signIn = (email, password) =>
  request('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () => request('/auth/me');

// Profile: change the name (the email cannot change), or delete the account (soft delete)
export const updateMe = (name) => request('/auth/me', { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteMe = () => request('/auth/me', { method: 'DELETE' });

// Demo account for the Sign In screen (404 when the server turned it off)
export const getTestUser = () => request('/auth/test-user');

// ---- Tasks (need a token) ----
export const getTasks = () => request('/tasks');

export const searchTasks = (keyword) =>
  request(`/tasks?search=${encodeURIComponent(keyword)}`);

export const createTask = (task) =>
  request('/tasks', { method: 'POST', body: JSON.stringify(task) });

export const updateTask = (id, changes) =>
  request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(changes) });

export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' });

// ---- Personal access tokens (for AI clients such as Claude, over MCP) ----
// The full token is in the createToken reply ONLY. The server keeps only a hash.
export const listAccessTokens = () => request('/tokens');
export const createAccessToken = (name) => request('/tokens', { method: 'POST', body: JSON.stringify({ name }) });
export const revokeAccessToken = (id) => request(`/tokens/${id}`, { method: 'DELETE' });

// MCP address = API address without "/api" + "/mcp"
export const MCP_URL = BASE_URL.replace(/\/api\/?$/, '') + '/mcp';
