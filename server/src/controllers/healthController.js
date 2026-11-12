// CONTROLLER for the server status. 200 when everything the app needs works, 503 when not.
import asyncHandler from '../utils/asyncHandler.js';
import * as healthService from '../services/healthService.js';

// GET /api/health
export const getHealth = asyncHandler(async (req, res) => {
  const status = await healthService.getStatus();
  res.status(status.status === 'ok' ? 200 : 503).json(status);
});
