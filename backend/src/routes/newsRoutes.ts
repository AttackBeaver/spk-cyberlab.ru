import { Router } from 'express';
import {
  getNews,
  getLatestNews,
  getNewsById,
  getMyNewsVotes,
  createNews,
  updateNews,
  deleteNews,
  uploadNewsImage,
  uploadImage,
  uploadNewsMedia,
  uploadMediaHandler,
  voteNews,
} from '../controllers/newsController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// ===== Публичные маршруты =====
router.get('/', getNews);
router.get('/latest', getLatestNews);

// ВАЖНО: /my-votes объявлен ДО /:id — иначе Express распарсит его как :id
router.get('/my-votes', authenticate, getMyNewsVotes);

router.get('/:id', getNewsById);

// ===== Загрузка файлов (только ADMIN) =====
router.post('/upload-image', authenticate, allowRoles('ADMIN'), uploadNewsImage, uploadImage);
router.post('/upload-media', authenticate, allowRoles('ADMIN'), uploadNewsMedia, uploadMediaHandler);

// ===== Голосование =====
router.post('/:id/vote', authenticate, voteNews);

// ===== CRUD (только ADMIN) =====
router.post('/', authenticate, allowRoles('ADMIN'), createNews);
router.put('/:id', authenticate, allowRoles('ADMIN'), updateNews);
router.delete('/:id', authenticate, allowRoles('ADMIN'), deleteNews);

export default router;