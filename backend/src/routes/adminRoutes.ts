import { Router } from 'express';
import { createGroup, addStudents, createTeacher, resetPassword } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

router.post('/groups', authenticate, allowRoles('ADMIN'), createGroup);
router.post('/students', authenticate, allowRoles('ADMIN'), addStudents);
router.post('/teachers', authenticate, allowRoles('ADMIN'), createTeacher);
router.post('/reset-password', authenticate, allowRoles('ADMIN'), resetPassword);

export default router;