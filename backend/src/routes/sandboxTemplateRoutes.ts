import { Router } from 'express';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createTaskFromTemplate,
} from '../controllers/sandboxTemplateController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Маршруты для шаблонов (только TEACHER/ADMIN)
router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', allowRoles('ADMIN'), createTemplate);
router.put('/:id', allowRoles('ADMIN'), updateTemplate);
router.delete('/:id', allowRoles('ADMIN'), deleteTemplate);

// Создание задания из шаблона
router.post('/:templateId/create-task', allowRoles('TEACHER', 'ADMIN'), createTaskFromTemplate);

export default router;