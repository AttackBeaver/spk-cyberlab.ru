import { Router } from 'express';
import {
  createGroup,
  addStudents,
  createTeacher,
  resetPassword,
  getAllUsers,
  getAllGroups,
  getAllCourses,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

router.post('/groups', authenticate, allowRoles('ADMIN'), createGroup);
router.post('/students', authenticate, allowRoles('ADMIN'), addStudents);
router.post('/teachers', authenticate, allowRoles('ADMIN'), createTeacher);
router.post('/reset-password', authenticate, allowRoles('ADMIN'), resetPassword);

router.get('/users', authenticate, allowRoles('ADMIN'), getAllUsers);
router.get('/groups', authenticate, allowRoles('ADMIN'), getAllGroups);
router.get('/courses', authenticate, allowRoles('ADMIN'), getAllCourses);

export default router;