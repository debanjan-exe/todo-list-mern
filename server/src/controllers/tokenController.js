// CONTROLLER for personal access tokens: HTTP only (req -> service -> res).
// Tokens can be managed only from the app (signed in with a normal login),
// not with another access token: a leaked token cannot create more tokens.
import asyncHandler from '../utils/asyncHandler.js';
import * as tokenService from '../services/tokenService.js';
import { ForbiddenError } from '../utils/errors.js';

function onlyFromApp(req) {
  if (req.authType !== 'session') throw new ForbiddenError('Manage access tokens from the app, not with an access token');
}

// GET /api/tokens  -> 200 [ { id, name, prefix, lastUsedAt, createdAt } ]
export const listTokens = asyncHandler(async (req, res) => {
  onlyFromApp(req);
  res.json(await tokenService.listTokens(req.userId));
});

// POST /api/tokens  { name }  -> 201 { ...token, token: "todo_pat_..." }  (shown once)
export const createToken = asyncHandler(async (req, res) => {
  onlyFromApp(req);
  res.status(201).json(await tokenService.createToken(req.userId, req.body));
});

// DELETE /api/tokens/:id  -> 200 { message }  (soft delete = revoke)
export const revokeToken = asyncHandler(async (req, res) => {
  onlyFromApp(req);
  await tokenService.revokeToken(req.userId, req.params.id);
  res.json({ message: 'Token revoked' });
});
