import { Router } from 'express';
import {
  getMemes,
  getPendingMemes,
  createMemeWithFile,
  approveMeme,
  rejectMeme,
  deleteMeme,
  voteMeme,
  getAuthorRanking,
  uploadMemeFile,
} from '../controllers/memeController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// Публичные маршруты
router.get('/', getMemes); // поддерживает query параметры: category, search, sort, page, limit
router.get('/authors/ranking', getAuthorRanking); // публичный рейтинг авторов

// Модерация (ADMIN)
router.get('/pending', authenticate, allowRoles('ADMIN'), getPendingMemes);

// Загрузка файла и создание мема (авторизованный)
router.post('/upload', authenticate, uploadMemeFile, createMemeWithFile);

// Голосование (авторизованный)
router.post('/:id/vote', authenticate, voteMeme);

// Управление (ADMIN)
router.put('/:id/approve', authenticate, allowRoles('ADMIN'), approveMeme);
router.delete('/:id/reject', authenticate, allowRoles('ADMIN'), rejectMeme);
router.delete('/:id', authenticate, allowRoles('ADMIN'), deleteMeme);

export default router;