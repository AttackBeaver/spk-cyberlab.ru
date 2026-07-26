import { Router } from 'express';
import { getTaskById, updateTask, deleteTask } from '../controllers/taskController';
import { createAttempt } from '../controllers/taskAttemptController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// Получить задание по ID (для студента)
router.get('/:id', authenticate, getTaskById);

// Обновить задание (только преподаватель/админ)
router.put('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), updateTask);

// Удалить задание (только преподаватель/админ)
router.delete('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), deleteTask);

// Отправить попытку выполнения задания
router.post('/:taskId/attempt', authenticate, createAttempt);

export default router;