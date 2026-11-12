// DATA layer: the only file that runs MongoDB queries for access tokens.
// Every find skips revoked tokens (isDeleted: true).
import AccessToken from '../models/AccessToken.js';

const ACTIVE = { isDeleted: false };

export function insertToken(data) {
  return AccessToken.create(data);
}

export function findActiveTokenByHash(tokenHash) {
  return AccessToken.findOne({ tokenHash, ...ACTIVE });
}

export function listTokens(userId) {
  return AccessToken.find({ user: userId, ...ACTIVE }).sort({ createdAt: -1 });
}

export function countTokens(userId) {
  return AccessToken.countDocuments({ user: userId, ...ACTIVE });
}

// Soft delete ("revoke"): mark only, never remove
export function markTokenRevoked(userId, id) {
  return AccessToken.findOneAndUpdate(
    { _id: id, user: userId, ...ACTIVE },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
}

export function touchToken(id) {
  return AccessToken.updateOne({ _id: id }, { lastUsedAt: new Date() });
}
