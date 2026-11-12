// Protects routes: the request must have a valid token.
// Header format:  Authorization: Bearer <token>
// If the token is OK AND the account still exists (not deleted),
// the user id is put on req.userId for the next layers.
import { verifyToken, checkActiveUser } from '../services/authService.js';
import { UnauthorizedError } from '../utils/errors.js';

export default async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return next(new UnauthorizedError('Please sign in'));

  try {
    const userId = verifyToken(token); // 401 if the token is wrong or expired
    await checkActiveUser(userId); // 401 if the account was deleted
    req.userId = userId;
    next();
  } catch (err) {
    next(err);
  }
}
