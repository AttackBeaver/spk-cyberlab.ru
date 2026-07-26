import { Router } from 'express';
import { getProfileStats, getLeaderboard, changePassword } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, getProfileStats);
router.get('/leaderboard', authenticate, getLeaderboard);
router.post('/change-password', authenticate, changePassword); // новый маршрут

export default router;