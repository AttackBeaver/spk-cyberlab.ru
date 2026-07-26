import { Router } from 'express';
import { getProfileStats, getLeaderboard, changePassword, getTaskHistory } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, getProfileStats);
router.get('/leaderboard', authenticate, getLeaderboard);
router.post('/change-password', authenticate, changePassword);
router.get('/history', authenticate, getTaskHistory); // новый маршрут

export default router;