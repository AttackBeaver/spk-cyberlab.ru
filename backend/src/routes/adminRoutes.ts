import { Router } from 'express';
import {
  createGroup,
  addStudents,
  createTeacher,
  resetPassword,
  getAllUsers,
  getAllGroups,
  getAllCourses,
  deleteUser,
  deleteGroup,
  updateUser,
  getLogs,
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
router.get('/logs', authenticate, allowRoles('ADMIN'), getLogs);
router.delete('/users/:id', authenticate, allowRoles('ADMIN'), deleteUser);
router.delete('/groups/:id', authenticate, allowRoles('ADMIN'), deleteGroup);
router.put('/users/:id', authenticate, allowRoles('ADMIN'), updateUser);

export default router;