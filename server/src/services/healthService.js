// SERVICE layer: server status for the app's loading screen.
// It checks each part the app needs and gives one overall status.
//
//   api       - this server answers (always "up" if you get a reply)
//   database  - MongoDB is connected and answers a ping (with the time in ms)
//   auth      - JWT_SECRET is set, so sign in can work
//   testUser  - the demo account exists (only a warning if not; the app still works)
import mongoose from 'mongoose';
import { dbState, pingDb } from '../config/db.js';
import { countTestUsers } from '../data/userData.js';
import { testUserEnabled } from './authService.js';

const VERSION = process.env.npm_package_version || '1.0.0';

// Run a check, but stop waiting after "ms" milliseconds
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms))]);

async function checkDatabase() {
  const state = dbState();
  if (state !== 'connected') return { status: 'down', message: `MongoDB is ${state}` };
  try {
    const latencyMs = await withTimeout(pingDb(), 2000);
    return { status: 'up', message: 'MongoDB is connected', latencyMs, name: mongoose.connection.name };
  } catch (err) {
    return { status: 'down', message: `MongoDB does not answer (${err.message})` };
  }
}

function checkAuth() {
  return process.env.JWT_SECRET
    ? { status: 'up', message: 'Sign in is ready' }
    : { status: 'down', message: 'JWT_SECRET is not set' };
}

async function checkTestUser(dbUp) {
  if (!testUserEnabled()) return { status: 'off', message: 'Test user is turned off' };
  if (!dbUp) return { status: 'warn', message: 'Waiting for the database' };
  const count = await withTimeout(countTestUsers(), 2000).catch(() => -1);
  if (count === 1) return { status: 'up', message: 'Test user is ready' };
  return { status: 'warn', message: 'Test user is not ready' };
}

export async function getStatus() {
  const database = await checkDatabase();
  const auth = checkAuth();
  const testUser = await checkTestUser(database.status === 'up');

  // The app can work only if the database and auth are up
  const ok = database.status === 'up' && auth.status === 'up';

  return {
    status: ok ? 'ok' : 'error',
    version: VERSION,
    uptimeSeconds: Math.round(process.uptime()),
    time: new Date().toISOString(),
    checks: {
      api: { status: 'up', message: 'Server is running' },
      database,
      auth,
      testUser,
    },
  };
}
