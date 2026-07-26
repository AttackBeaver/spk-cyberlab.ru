import { Router } from 'express';
import {
  getTasksByTopic,
  createTask,
  updateTask,
  deleteTask,
  getTaskById, // <-- добавлен импорт
} from '../controllers/taskController';
import { createAttempt } from '../controllers/taskAttemptController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router({ mergeParams: true });

router.get('/', getTasksByTopic);
router.get('/:id', authenticate, getTaskById); // теперь getTaskById определён
router.post('/', authenticate, allowRoles('TEACHER', 'ADMIN'), createTask);
router.put('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), updateTask);
router.delete('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), deleteTask);
router.post('/:taskId/attempt', authenticate, createAttempt);

export default router;