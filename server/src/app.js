// Builds the Express app: middlewares, routes and the error handler.
// It does not connect to MongoDB or start listening (index.js does that),
// so the app can also be used in tests.
// Request flow: route -> controller (HTTP) -> service (rules) -> data (MongoDB queries)
// MCP (/mcp) uses the same services: mcp/tools.js -> services -> data
import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/taskRoutes.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import mcpRoutes from './routes/mcpRoutes.js';
import requireAuth from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || '*' })); // allow the React app to call us
app.use(express.json()); // parse JSON request bodies

// Health check (useful for Render / uptime checks)
app.get('/', (req, res) => res.json({ status: 'ok', message: 'To-Do API is running' }));

// Public: server status (MongoDB, auth, test user) for the app's loading screen
app.use('/api/health', healthRoutes);

// Public: sign up / sign in
app.use('/api/auth', authRoutes);

// Private: all task routes need a valid token (requireAuth runs first)
app.use('/api/tasks', requireAuth, taskRoutes);

// Private: personal access tokens for MCP clients (managed from the app)
app.use('/api/tokens', requireAuth, tokenRoutes);

// MCP endpoint for AI clients such as Claude (Bearer personal access token)
app.use('/mcp', requireAuth, mcpRoutes);

// Unknown routes -> 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler (any error passed to next(err) ends here)
app.use(errorHandler);

export default app;
