// ROUTES for personal access tokens (all need a sign-in; app.js adds requireAuth).
import { Router } from 'express';
import { listTokens, createToken, revokeToken } from '../controllers/tokenController.js';

const router = Router();

router.get('/', listTokens); //          GET    /api/tokens
router.post('/', createToken); //        POST   /api/tokens
router.delete('/:id', revokeToken); //   DELETE /api/tokens/:id (revoke = soft delete)

export default router;
