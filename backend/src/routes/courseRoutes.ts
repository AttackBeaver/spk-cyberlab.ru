import { Router } from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

router.get('/', getAllCourses); // публичный (или можно закрыть)
router.get('/:id', getCourseById); // публичный
router.post('/', authenticate, allowRoles('TEACHER', 'ADMIN'), createCourse);
router.put('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), updateCourse);
router.delete('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), deleteCourse);

export default router;