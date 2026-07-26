import { Router } from 'express';
import { getProfileStats } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/stats', authenticate, getProfileStats);

export default router;