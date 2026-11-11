import { Router } from 'express';
import {
  getMemes,
  getPendingMemes,
  getAllMemesAdmin,
  createMemeWithFile,
  approveMeme,
  rejectMeme,
  deleteMeme,
  restoreMeme,
  hardDeleteMeme,
  voteMeme,
  getAuthorRanking,
  uploadMemeFile,
  exportMemesZip,
} from '../controllers/memeController';
import { authenticate } from '../middleware/auth';
import { allowRoles } from '../middleware/roleCheck';

const router = Router();

// ===== Публичные маршруты =====
router.get('/', getMemes); // query: category, search, sort, page, limit
router.get('/authors/ranking', getAuthorRanking);

// ===== Экспорт ZIP (только ADMIN) — ДОЛЖЕН быть до /:id/* =====
router.get('/export', authenticate, allowRoles('ADMIN'), exportMemesZip);

// ===== Админский список с фильтром по статусу (только ADMIN) =====
router.get('/admin/all', authenticate, allowRoles('ADMIN'), getAllMemesAdmin);

// ===== Модерация (только ADMIN) =====
router.get('/pending', authenticate, allowRoles('ADMIN'), getPendingMemes);

// ===== Загрузка (авторизованный) =====
router.post('/upload', authenticate, uploadMemeFile, createMemeWithFile);

// ===== Голосование (авторизованный) =====
router.post('/:id/vote', authenticate, voteMeme);

// ===== Управление мемом (только ADMIN) =====
router.put('/:id/approve', authenticate, allowRoles('ADMIN'), approveMeme);

// Отклонить — поддерживаем и PATCH (новый), и DELETE (старый фронт)
router.patch('/:id/reject', authenticate, allowRoles('ADMIN'), rejectMeme);
router.delete('/:id/reject', authenticate, allowRoles('ADMIN'), rejectMeme);

// Восстановить из корзины
router.patch('/:id/restore', authenticate, allowRoles('ADMIN'), restoreMeme);

// Окончательное удаление (БД + файл) — ДОЛЖЕН быть до /:id
router.delete('/:id/hard', authenticate, allowRoles('ADMIN'), hardDeleteMeme);

// Soft-delete (в корзину) — старое поведение, теперь безопасное
router.delete('/:id', authenticate, allowRoles('ADMIN'), deleteMeme);

export default router;