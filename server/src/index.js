// Entry point: load .env, start the server, then connect to MongoDB.
// The server starts first, so GET /api/health can answer even while MongoDB is down.
// The Express app itself (routes, middlewares) is in app.js.
import 'dotenv/config';
import app from './app.js';
import { connectWithRetry } from './config/db.js';
import { ensureTestUser } from './services/authService.js';
import { prepareUserCollection } from './data/userData.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing in .env (see .env.example)');
  process.exit(1);
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// After each successful connect: update old accounts + indexes, then make sure the ONE test user exists
connectWithRetry(async () => {
  await prepareUserCollection();
  const testUser = await ensureTestUser();
  if (testUser) console.log(`Test user ready: ${testUser.email}`);
});
