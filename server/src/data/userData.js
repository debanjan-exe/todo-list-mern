// DATA layer: the only file that runs MongoDB queries for users.
// Every "find" skips soft-deleted accounts (isDeleted: true).
import User from '../models/User.js';

const ACTIVE = { isDeleted: false };

// withPassword = true also returns the password hash (needed only to sign in)
export function findUserByEmail(email, withPassword = false) {
  const query = User.findOne({ email: email.toLowerCase().trim(), ...ACTIVE });
  return withPassword ? query.select('+password') : query;
}

export function findUserById(id) {
  return User.findOne({ _id: id, ...ACTIVE });
}

// Change the allowed profile fields (only "name" today)
export function updateUserById(id, changes) {
  return User.findOneAndUpdate({ _id: id, ...ACTIVE }, changes, { new: true, runValidators: true });
}

// Soft delete: mark only, never remove the document
export function markUserDeleted(id) {
  return User.findOneAndUpdate({ _id: id, ...ACTIVE }, { isDeleted: true, deletedAt: new Date() }, { new: true });
}

// Run once after each connect:
//   1. old accounts (made before soft delete) get isDeleted: false
//   2. make the database indexes match the schema (drops the old "email unique" index,
//      adds "email unique for active accounts" and "only one test user")
export async function prepareUserCollection() {
  await User.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false, deletedAt: null } });
  await User.syncIndexes();
}

export function insertUser(data) {
  return User.create(data);
}

// Create the test user, or update it if it already exists (there is only one).
// upsert = "update, or insert if not found".
export function upsertTestUser({ name, email, password }) {
  return User.findOneAndUpdate(
    { isTestUser: true },
    { name, email, password, isTestUser: true, isDeleted: false, deletedAt: null },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

export function countTestUsers() {
  return User.countDocuments({ isTestUser: true });
}
