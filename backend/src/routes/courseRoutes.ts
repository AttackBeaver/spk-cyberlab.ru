import { Router } from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
} from '../controllers/courseController';
import {
  getLecturesByCourse,
  getLectureById,
  createLecture,
  updateLecture,
  deleteLecture,
  uploadLectureFile,
  assignGroupsToCourse,
  getCourseGroups,
} from '../controllers/lectureController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// ===== Публичные маршруты =====
router.get('/', getAllCourses);

// ===== Защищённые маршруты (аутентификация обязательна) =====
// Маршруты для преподавателей/админов (должны быть перед /:id)
router.get('/my', authenticate, allowRoles('TEACHER', 'ADMIN'), getMyCourses);

// ===== Маршруты для лекций =====
// Получение всех лекций курса (с проверкой доступа)
router.get('/:courseId/lectures', authenticate, getLecturesByCourse);
// Получение одной лекции (с проверкой доступа)
router.get('/lectures/:lectureId', authenticate, getLectureById);

// Создание лекции (с загрузкой PDF)
router.post(
  '/:courseId/lectures',
  authenticate,
  allowRoles('TEACHER', 'ADMIN'),
  uploadLectureFile,
  createLecture
);

// Обновление лекции (с возможностью замены PDF)
router.put(
  '/lectures/:lectureId',
  authenticate,
  allowRoles('TEACHER', 'ADMIN'),
  uploadLectureFile,
  updateLecture
);

// Удаление лекции
router.delete(
  '/lectures/:lectureId',
  authenticate,
  allowRoles('TEACHER', 'ADMIN'),
  deleteLecture
);

// ===== Маршруты для назначения групп на курс =====
// Назначить группы на курс
router.post(
  '/:courseId/groups',
  authenticate,
  allowRoles('TEACHER', 'ADMIN'),
  assignGroupsToCourse
);

// Получить группы, имеющие доступ к курсу
router.get(
  '/:courseId/groups',
  authenticate,
  allowRoles('TEACHER', 'ADMIN'),
  getCourseGroups
);

// ===== Базовые CRUD для курсов (должны быть в конце) =====
router.get('/:id', getCourseById);
router.post('/', authenticate, allowRoles('TEACHER', 'ADMIN'), createCourse);
router.put('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), updateCourse);
router.delete('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), deleteCourse);

export default router;