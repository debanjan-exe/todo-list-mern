// MongoDB connection.
// The server starts even when MongoDB is down, and keeps trying to connect every 5 seconds.
// So GET /api/health can tell the app "database: down" instead of the server not answering at all.
import mongoose from 'mongoose';

const RETRY_MS = 5000;
const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// "connected", "connecting", ... (for the health check)
export const dbState = () => STATES[mongoose.connection.readyState] || 'unknown';

// Try to connect. On failure, try again after RETRY_MS. onConnected runs after each successful connect.
export async function connectWithRetry(onConnected) {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');
    await onConnected?.();
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}. Trying again in ${RETRY_MS / 1000}s`);
    setTimeout(() => connectWithRetry(onConnected), RETRY_MS);
  }
}

// Send a "ping" to MongoDB and measure how long the answer takes (milliseconds)
export async function pingDb() {
  const start = Date.now();
  await mongoose.connection.db.admin().ping();
  return Date.now() - start;
}

// Log when the connection drops or comes back (mongoose reconnects by itself)
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
