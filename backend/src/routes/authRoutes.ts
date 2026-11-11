import { Router } from 'express';
import { registerStudent, login, logout, getProfile, getGroups } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register-student', registerStudent);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.get('/groups', getGroups);

export default router;