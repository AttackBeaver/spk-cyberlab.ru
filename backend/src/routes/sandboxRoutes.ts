import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTaskToGroups,
  getTaskGroups,
} from '../controllers/sandboxTaskController';
import {
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAttemptDetails,
} from '../controllers/sandboxExecutionController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD заданий (для преподавателей и админов)
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', allowRoles('TEACHER', 'ADMIN'), createTask);
router.put('/:id', allowRoles('TEACHER', 'ADMIN'), updateTask);
router.delete('/:id', allowRoles('TEACHER', 'ADMIN'), deleteTask);
router.post('/:id/assign', allowRoles('TEACHER', 'ADMIN'), assignTaskToGroups);
router.get('/:id/groups', allowRoles('TEACHER', 'ADMIN'), getTaskGroups);

// Маршруты выполнения (для студентов)
router.post('/tasks/:taskId/start', startAttempt);
router.post('/tasks/:taskId/submit', submitAttempt);
router.get('/my-attempts', getMyAttempts);
router.get('/attempts/:attemptId', getAttemptDetails);

export default router;