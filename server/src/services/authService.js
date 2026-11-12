// SERVICE layer: sign up, sign in, and token rules.
// No req / res here, and no MongoDB queries (the data layer does them).
//
// How auth works:
//   1. Sign up / sign in -> the server makes a JWT (a signed token with the user id).
//   2. The client sends it on every request:  Authorization: Bearer <token>
//   3. middleware/auth.js checks the token and puts the user id on req.userId.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userData from '../data/userData.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

const SALT_ROUNDS = 10; // how much work bcrypt does to hash a password
const MIN_PASSWORD = 6;

function getSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set in .env');
  return process.env.JWT_SECRET;
}

// Make a token that holds the user id. It expires (default 7 days).
function createToken(userId) {
  return jwt.sign({ id: userId }, getSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// Only safe fields go back to the client (never the password hash)
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, isTestUser: !!user.isTestUser });

export async function signUp({ name = '', email = '', password = '' }) {
  if (!name.trim() || !email.trim() || !password) throw new BadRequestError('Name, email and password are required');
  if (password.length < MIN_PASSWORD) throw new BadRequestError(`Password must have at least ${MIN_PASSWORD} characters`);
  if (await userData.findUserByEmail(email)) throw new ConflictError('An account with this email already exists');

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userData.insertUser({ name, email, password: hash }); // the model checks the email format
  return { token: createToken(user._id), user: publicUser(user) };
}

export async function signIn({ email = '', password = '' }) {
  if (!email.trim() || !password) throw new BadRequestError('Email and password are required');

  const user = await userData.findUserByEmail(email, true);
  // Same message for "no user" and "wrong password", so nobody can find out which emails exist
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError('Email or password is wrong');
  }
  return { token: createToken(user._id), user: publicUser(user) };
}

// Used by the auth middleware: token -> user id (throws 401 if invalid or expired)
export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret()).id;
  } catch {
    throw new UnauthorizedError('Session expired. Please sign in again');
  }
}

// The signed-in user's account (401 if it does not exist or was deleted)
async function findActiveUser(userId) {
  const user = await userData.findUserById(userId);
  if (!user) throw new UnauthorizedError('Account not found. Please sign in again');
  return user;
}

export async function getMe(userId) {
  return publicUser(await findActiveUser(userId));
}

// Used by the auth middleware on every private request:
// a deleted account cannot keep using an old token.
export async function checkActiveUser(userId) {
  await findActiveUser(userId);
}

// ---------- Profile ----------
const MAX_NAME = 50;

// Edit the profile. Only the name can change: the email is the sign-in id, so it is ignored.
export async function updateMe(userId, { name = '' }) {
  const clean = String(name).trim();
  if (!clean) throw new BadRequestError('Name is required');
  if (clean.length > MAX_NAME) throw new BadRequestError(`Name can have at most ${MAX_NAME} characters`);
  const user = await userData.updateUserById(userId, { name: clean });
  if (!user) throw new UnauthorizedError('Account not found. Please sign in again');
  return publicUser(user);
}

// Delete the account SOFTLY: it is only marked (isDeleted: true), never removed.
// The user cannot sign in again with it; their tasks stay in the database, hidden.
// The demo account cannot be deleted, so the Sign In screen always has a working test login.
export async function deleteMe(userId) {
  const user = await findActiveUser(userId);
  if (user.isTestUser) throw new ForbiddenError('The test account cannot be deleted');
  await userData.markUserDeleted(userId);
}

// ---------- Test user (demo account) ----------
// On every server start the server makes sure ONE test user exists, with a known password,
// so the Sign In screen can fill it in. Turn it off with TEST_USER_ENABLED=false.
export const testUserEnabled = () => process.env.TEST_USER_ENABLED !== 'false';

export function getTestUserCredentials() {
  return {
    name: process.env.TEST_USER_NAME || 'Test User',
    email: (process.env.TEST_USER_EMAIL || 'test@todo.app').toLowerCase(),
    password: process.env.TEST_USER_PASSWORD || 'Test@1234',
  };
}

export async function ensureTestUser() {
  if (!testUserEnabled()) return null;
  const { name, email, password } = getTestUserCredentials();
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  // Same document every time (isTestUser: true) -> never a second test user.
  // The password is reset on each start, so the filled-in password always works.
  try {
    return await userData.upsertTestUser({ name, email, password: hash });
  } catch (err) {
    // A normal account already uses this email: keep that account as it is
    if (err.code === 11000) {
      console.warn(`Test user not created: "${email}" is used by a normal account. Set TEST_USER_EMAIL to another email.`);
      return null;
    }
    throw err;
  }
}

// What the Sign In screen gets (only when the test user is enabled)
export function getTestUserForSignIn() {
  if (!testUserEnabled()) throw new NotFoundError('Test user is turned off');
  const { email, password } = getTestUserCredentials();
  return { email, password };
}
