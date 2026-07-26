import { Router } from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
} from '../controllers/courseController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// Публичные маршруты (доступны всем)
router.get('/', getAllCourses);

// Защищённые маршруты
router.get('/my', authenticate, allowRoles('TEACHER', 'ADMIN'), getMyCourses); // <-- сначала /my
router.get('/:id', getCourseById); // <-- потом /:id
router.post('/', authenticate, allowRoles('TEACHER', 'ADMIN'), createCourse);
router.put('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), updateCourse);
router.delete('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), deleteCourse);

export default router;