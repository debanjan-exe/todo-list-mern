// CONTROLLER layer for auth: HTTP only (req -> service -> res).
import asyncHandler from '../utils/asyncHandler.js';
import * as authService from '../services/authService.js';

// POST /api/auth/signup   { name, email, password }  -> 201 { token, user }
export const signUp = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.signUp(req.body));
});

// POST /api/auth/signin   { email, password }  -> 200 { token, user }
export const signIn = asyncHandler(async (req, res) => {
  res.json(await authService.signIn(req.body));
});

// GET /api/auth/me   (needs a token)  -> 200 { user }
export const me = asyncHandler(async (req, res) => {
  res.json({ user: await authService.getMe(req.userId) });
});

// PUT /api/auth/me   { name }  (needs a token)  -> 200 { user }   (email cannot change)
export const updateMe = asyncHandler(async (req, res) => {
  res.json({ user: await authService.updateMe(req.userId, req.body) });
});

// DELETE /api/auth/me   (needs a token)  -> 200 { message }   (soft delete)
export const deleteMe = asyncHandler(async (req, res) => {
  await authService.deleteMe(req.userId);
  res.json({ message: 'Account deleted' });
});

// GET /api/auth/test-user  -> 200 { email, password }  (404 when TEST_USER_ENABLED=false)
export const testUser = (req, res) => {
  res.json(authService.getTestUserForSignIn());
};
