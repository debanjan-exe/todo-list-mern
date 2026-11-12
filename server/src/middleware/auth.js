// Protects routes: the request must have a valid token.
// Header format:  Authorization: Bearer <token>
//
// Two kinds of token are accepted:
//   - a sign-in token (JWT) from the app             -> req.authType = 'session'
//   - a personal access token "todo_pat_..." (MCP)   -> req.authType = 'access-token'
// If the token is OK AND the account still exists (not deleted),
// the user id is put on req.userId for the next layers.
import { verifyToken, checkActiveUser } from '../services/authService.js';
import { isAccessToken, verifyAccessToken } from '../services/tokenService.js';
import { UnauthorizedError } from '../utils/errors.js';

export default async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return next(new UnauthorizedError('Please sign in'));

  try {
    const accessToken = isAccessToken(token);
    // 401 if the token is wrong, expired or revoked
    const userId = accessToken ? await verifyAccessToken(token) : verifyToken(token);
    await checkActiveUser(userId); // 401 if the account was deleted
    req.userId = userId;
    req.authType = accessToken ? 'access-token' : 'session';
    next();
  } catch (err) {
    next(err);
  }
}
