// ROUTES for the server status (public, used by the app's loading screen).
import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealth); // GET /api/health

export default router;
