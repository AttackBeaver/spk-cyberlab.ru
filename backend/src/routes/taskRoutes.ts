import { Router } from 'express';
import {
  getTasksByTopic,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router({ mergeParams: true });

router.get('/', getTasksByTopic);
router.post('/', authenticate, allowRoles('TEACHER', 'ADMIN'), createTask);
router.put('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), updateTask);
router.delete('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), deleteTask);

export default router;