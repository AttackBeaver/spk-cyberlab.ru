import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';

// ===== Multer настройка =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/memes');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла'));
    }
  },
});

export const uploadMemeFile = upload.single('file');

// ===== Основные функции =====

// Получить все одобренные мемы (публично)
export const getApprovedMemes = async (req: Request, res: Response) => {
  const memes = await prisma.meme.findMany({
    where: { approved: true },
    include: { author: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(memes);
};

// Получить мемы на модерацию (только ADMIN)
export const getPendingMemes = async (req: Request, res: Response) => {
  const memes = await prisma.meme.findMany({
    where: { approved: false },
    include: { author: { select: { fullName: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(memes);
};

// Создать мем с загруженным файлом
export const createMemeWithFile = async (req: Request, res: Response) => {
  const { title, category } = req.body;
  const authorId = (req as any).user.id;
  const userRole = (req as any).user.role;

  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const imageUrl = `/uploads/memes/${req.file.filename}`;
  const approved = userRole === 'ADMIN';

  const meme = await prisma.meme.create({
    data: {
      title,
      imageUrl,
      category,
      authorId,
      approved,
      approvedBy: approved ? authorId : null,
    },
  });
  res.status(201).json(meme);
};

// Одобрить мем (только ADMIN)
export const approveMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = (req as any).user.id;
  const meme = await prisma.meme.update({
    where: { id: Number(id) },
    data: { approved: true, approvedBy: adminId },
  });
  res.json(meme);
};

// Отклонить мем (удалить) – только ADMIN
export const rejectMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.meme.delete({ where: { id: Number(id) } });
  res.status(204).send();
};

// Удалить мем (только ADMIN)
export const deleteMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.meme.delete({ where: { id: Number(id) } });
  res.status(204).send();
};

// Лайкнуть мем
export const likeMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const meme = await prisma.meme.update({
    where: { id: Number(id) },
    data: { likes: { increment: 1 } },
  });
  res.json({ likes: meme.likes });
};

// Дизлайкнуть мем
export const dislikeMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const meme = await prisma.meme.update({
    where: { id: Number(id) },
    data: { dislikes: { increment: 1 } },
  });
  res.json({ dislikes: meme.dislikes });
};