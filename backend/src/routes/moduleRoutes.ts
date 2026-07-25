import { Router } from 'express';
import {
  getModulesByCourse,
  createModule,
  updateModule,
  deleteModule,
} from '../controllers/moduleController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router({ mergeParams: true });

router.get('/', getModulesByCourse);
router.post('/', authenticate, allowRoles('TEACHER', 'ADMIN'), createModule);
router.put('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), updateModule);
router.delete('/:id', authenticate, allowRoles('TEACHER', 'ADMIN'), deleteModule);

export default router;