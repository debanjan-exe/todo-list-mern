// ROUTES for auth. Sign up, sign in and test-user are public; /me needs a token.
import { Router } from 'express';
import { signUp, signIn, me, updateMe, deleteMe, testUser } from '../controllers/authController.js';
import requireAuth from '../middleware/auth.js';

const router = Router();

router.post('/signup', signUp); //      POST /api/auth/signup
router.post('/signin', signIn); //      POST /api/auth/signin
router.get('/me', requireAuth, me); //  GET  /api/auth/me
router.put('/me', requireAuth, updateMe); //    PUT    /api/auth/me  (edit name)
router.delete('/me', requireAuth, deleteMe); // DELETE /api/auth/me  (soft delete account)
router.get('/test-user', testUser); //   GET  /api/auth/test-user (demo login for the Sign In screen)

export default router;
