import { Router } from 'express';
import {
  getTopicsByModule,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../controllers/topicController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router({ mergeParams: true });

router.get('/', getTopicsByModule);
router.post('/', authenticate, allowRoles('TEACHER', 'ADMIN'), createTopic);
router.put('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), updateTopic);
router.delete('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), deleteTopic);

export default router;