import { Router } from 'express';
import {
  getNews,
  getLatestNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} from '../controllers/newsController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// Публичные маршруты (доступны всем)
router.get('/', getNews);
router.get('/latest', getLatestNews);
router.get('/:id', getNewsById);

// Защищённые маршруты (только ADMIN)
router.post('/', authenticate, allowRoles('ADMIN'), createNews);
router.put('/:id', authenticate, allowRoles('ADMIN'), updateNews);
router.delete('/:id', authenticate, allowRoles('ADMIN'), deleteNews);

export default router;