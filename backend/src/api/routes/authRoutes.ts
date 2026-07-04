import { Router } from 'express';
import { registerHandler, loginHandler, logoutHandler, meHandler } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/auth/register', registerHandler);
router.post('/auth/login', loginHandler);
router.post('/auth/logout', logoutHandler);
router.get('/auth/me', authMiddleware, meHandler);

export default router;
