import { Router } from 'express';
import {
  getApprovedMemes,
  getPendingMemes,
  createMemeWithFile,
  approveMeme,
  rejectMeme,
  deleteMeme,
  likeMeme,
  dislikeMeme,
  uploadMemeFile,
} from '../controllers/memeController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// Публичные
router.get('/', getApprovedMemes);

// Модерация (ADMIN)
router.get('/pending', authenticate, allowRoles('ADMIN'), getPendingMemes);

// Загрузка файла и создание мема (авторизованный)
router.post('/upload', authenticate, uploadMemeFile, createMemeWithFile);

// Лайки / дизлайки (авторизованный)
router.post('/:id/like', authenticate, likeMeme);
router.post('/:id/dislike', authenticate, dislikeMeme);

// Управление (ADMIN)
router.put('/:id/approve', authenticate, allowRoles('ADMIN'), approveMeme);
router.delete('/:id/reject', authenticate, allowRoles('ADMIN'), rejectMeme);
router.delete('/:id', authenticate, allowRoles('ADMIN'), deleteMeme);

export default router;