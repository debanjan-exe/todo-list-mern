// SERVICE layer: a SMALL OAuth 2.1 server, so Claude can connect with one click
// ("Add custom connector" -> Connect -> sign in -> Allow).
//
// Flow (authorization code + PKCE, the same steps as Retainia's MCP OAuth, but simpler):
//   1. register   Claude registers itself          -> client_id (a signed JWT, nothing saved)
//   2. authorize  Claude opens /oauth/authorize    -> we check it, then send the browser to the app's consent page
//   3. approve    the signed-in user taps "Allow"  -> one-time code (a signed JWT, 5 minutes)
//   4. token      Claude sends code + PKCE verifier -> a personal access token (todo_pat_...)
//
// Why signed JWTs and no new collections: nothing to store or clean up, and it works on many instances.
// The access token is a normal personal access token, so the user sees it in Profile and can revoke it.
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as tokenService from './tokenService.js';

// A different key from the sign-in JWT, so an OAuth JWT can never be used as a session
const secret = () => `${process.env.JWT_SECRET}:oauth`;
const CODE_TTL = '5m';

// OAuth errors use the OAuth reply format: { error, error_description }
export class OAuthError extends Error {
  constructor(error, description, status = 400) {
    super(description);
    this.error = error;
    this.status = status;
  }
}

// ---- redirect URIs we trust ----
// Claude web / desktop: https://claude.ai/... and https://claude.com/...
// Claude Code and local tools: http://localhost:<port>/... or http://127.0.0.1:<port>/...
// More hosts can be added with OAUTH_REDIRECT_HOSTS (comma-separated).
const trustedHosts = () => [
  'claude.ai',
  'claude.com',
  ...(process.env.OAUTH_REDIRECT_HOSTS || '').split(',').map((h) => h.trim()).filter(Boolean),
];

export function isRedirectUriAllowed(uri) {
  try {
    const { protocol, hostname } = new URL(uri);
    if (protocol === 'http:') return hostname === 'localhost' || hostname === '127.0.0.1';
    if (protocol !== 'https:') return false;
    return trustedHosts().some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

// ---- metadata (discovery) ----
// baseUrl = the public address of this API, for example https://todo-list-api-1n6q.onrender.com
export const protectedResourceMetadata = (baseUrl) => ({
  resource: `${baseUrl}/mcp`,
  authorization_servers: [baseUrl],
  bearer_methods_supported: ['header'],
});

export const authorizationServerMetadata = (baseUrl) => ({
  issuer: baseUrl,
  authorization_endpoint: `${baseUrl}/oauth/authorize`,
  token_endpoint: `${baseUrl}/oauth/token`,
  registration_endpoint: `${baseUrl}/oauth/register`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'], // public clients + PKCE, no client secret
});

// ---- 1. register (RFC 7591, stateless) ----
export function registerClient({ client_name: clientName, redirect_uris: redirectUris } = {}) {
  const uris = Array.isArray(redirectUris) ? redirectUris : [];
  if (!uris.length || !uris.every(isRedirectUriAllowed)) {
    throw new OAuthError('invalid_redirect_uri', 'Only Claude and localhost redirect URIs are allowed');
  }
  const name = String(clientName || 'Claude').slice(0, 30);
  // The client id IS the signed client record (name + allowed redirect URIs)
  const clientId = jwt.sign({ typ: 'client', name, uris, n: crypto.randomBytes(6).toString('hex') }, secret()); // n: every client id is different
  return {
    client_id: clientId,
    client_name: name,
    redirect_uris: uris,
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  };
}

function readClient(clientId) {
  try {
    const client = jwt.verify(String(clientId), secret());
    if (client.typ === 'client') return client;
  } catch {
    // fall through
  }
  throw new OAuthError('invalid_client', 'Unknown client. Remove the connector and add it again.');
}

// ---- 2. authorize: check the request (used by /oauth/authorize AND by the consent page) ----
export function checkAuthorizeRequest(query = {}) {
  const client = readClient(query.client_id);
  if (!query.redirect_uri || !client.uris.includes(query.redirect_uri)) {
    throw new OAuthError('invalid_request', 'redirect_uri is not registered for this client');
  }
  if (query.response_type !== 'code') throw new OAuthError('unsupported_response_type', 'response_type must be code');
  if (!query.code_challenge || query.code_challenge_method !== 'S256') {
    throw new OAuthError('invalid_request', 'PKCE with S256 is required');
  }
  return { clientName: client.name, redirectUri: query.redirect_uri };
}

// Adds code / error and state to the client's redirect URI
function buildRedirect(redirectUri, params) {
  const url = new URL(redirectUri);
  Object.entries(params).forEach(([key, value]) => value && url.searchParams.set(key, value));
  return url.toString();
}

// For the consent page: who asks, and where to go on "Cancel"
export function getConsentInfo(query) {
  const { clientName, redirectUri } = checkAuthorizeRequest(query);
  return {
    clientName,
    denyUrl: buildRedirect(redirectUri, { error: 'access_denied', state: query.state }),
  };
}

// ---- 3. approve: the signed-in user tapped "Allow" -> one-time code ----
const clientKey = (clientId) => crypto.createHash('sha256').update(String(clientId)).digest('hex').slice(0, 24);

export function approve(userId, query) {
  const { redirectUri } = checkAuthorizeRequest(query);
  const code = jwt.sign(
    { typ: 'code', uid: String(userId), cid: clientKey(query.client_id), ru: redirectUri, cc: query.code_challenge },
    secret(),
    { expiresIn: CODE_TTL }
  );
  return { redirectUrl: buildRedirect(redirectUri, { code, state: query.state }) };
}

// ---- 4. token: code + PKCE verifier -> access token ----
export async function exchangeCode(body = {}) {
  if (body.grant_type !== 'authorization_code') {
    throw new OAuthError('unsupported_grant_type', 'Only authorization_code is supported');
  }
  const client = readClient(body.client_id);

  let code;
  try {
    code = jwt.verify(String(body.code), secret());
  } catch {
    throw new OAuthError('invalid_grant', 'The code is not valid or has expired');
  }
  if (code.typ !== 'code' || code.cid !== clientKey(body.client_id) || code.ru !== body.redirect_uri) {
    throw new OAuthError('invalid_grant', 'The code does not match this client');
  }

  // PKCE: sha256(verifier) must equal the challenge sent in step 2
  const challenge = crypto.createHash('sha256').update(String(body.code_verifier || '')).digest('base64url');
  if (challenge !== code.cc) throw new OAuthError('invalid_grant', 'code_verifier is not correct');

  // A normal personal access token. Connecting the same client again replaces its old token.
  const created = await tokenService.createOAuthToken(code.uid, { name: client.name, oauthClient: code.cid });
  return { access_token: created.token, token_type: 'Bearer', scope: 'tasks' };
}
