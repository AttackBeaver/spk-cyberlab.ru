import { Router } from 'express';
import {
  getAllReports,
  getMyReports,
  getReportById,
  createReport,
  respondToReport,
  deleteReport,
} from '../controllers/bugReportController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Маршруты для всех авторизованных
router.post('/', createReport);
router.get('/my', getMyReports);

// Маршруты для ADMIN
router.get('/', allowRoles('ADMIN'), getAllReports);
router.get('/:id', getReportById); // проверка прав внутри
router.put('/:id/respond', allowRoles('ADMIN'), respondToReport);
router.delete('/:id', allowRoles('ADMIN'), deleteReport);

export default router;