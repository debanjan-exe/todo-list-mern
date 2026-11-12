// SERVICE layer: personal access tokens (PAT) for MCP clients.
//
//   create  -> random token "todo_pat_..." shown ONCE; only its SHA-256 hash is saved
//   verify  -> hash the token from the request, find an active one -> user id
//   revoke  -> soft delete (the token stops working at once, the record stays)
import crypto from 'crypto';
import mongoose from 'mongoose';
import * as tokenData from '../data/tokenData.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

export const TOKEN_PREFIX = 'todo_pat_';
const MAX_TOKENS = 10; // per user
const MAX_NAME = 40;

export const isAccessToken = (value = '') => value.startsWith(TOKEN_PREFIX);

// SHA-256 is enough here (not bcrypt): the token is long and random, so it cannot be guessed,
// and a fast hash keeps the check cheap on every MCP request.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// What the client may see (never the hash)
const publicToken = (t) => ({
  id: t._id,
  name: t.name,
  prefix: t.prefix,
  lastUsedAt: t.lastUsedAt,
  createdAt: t.createdAt,
});

export async function createToken(userId, { name = '' } = {}) {
  const clean = String(name).trim();
  if (!clean) throw new BadRequestError('Name is required');
  if (clean.length > MAX_NAME) throw new BadRequestError(`Name can have at most ${MAX_NAME} characters`);
  if ((await tokenData.countTokens(userId)) >= MAX_TOKENS) {
    throw new BadRequestError(`You can have at most ${MAX_TOKENS} tokens. Revoke one first.`);
  }

  const token = TOKEN_PREFIX + crypto.randomBytes(32).toString('base64url'); // 256 random bits
  const saved = await tokenData.insertToken({
    user: userId,
    name: clean,
    tokenHash: hashToken(token),
    prefix: token.slice(0, TOKEN_PREFIX.length + 6),
  });
  return { ...publicToken(saved), token }; // the ONLY time the full token is returned
}

export async function listTokens(userId) {
  const tokens = await tokenData.listTokens(userId);
  return tokens.map(publicToken);
}

export async function revokeToken(userId, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError('Token not found');
  const token = await tokenData.markTokenRevoked(userId, id);
  if (!token) throw new NotFoundError('Token not found');
}

// Used by the auth middleware: token -> user id (401 if unknown or revoked)
export async function verifyAccessToken(token) {
  const found = await tokenData.findActiveTokenByHash(hashToken(token));
  if (!found) throw new UnauthorizedError('Access token is not valid or was revoked');
  tokenData.touchToken(found._id).catch(() => {}); // "last used" time; do not wait for it
  return String(found.user);
}
