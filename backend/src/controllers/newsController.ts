import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';

// ===== Multer настройка для изображений новостей =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/news');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'news-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат изображения'));
    }
  },
});

export const uploadNewsImage = upload.single('image');

// ===== Основные функции =====

// Получить все новости
export const getNews = async (req: Request, res: Response) => {
  const news = await prisma.news.findMany({
    include: {
      author: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(news);
};

// Получить последние N новостей
export const getLatestNews = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const news = await prisma.news.findMany({
    include: {
      author: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(news);
};

// Получить новость по ID
export const getNewsById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const news = await prisma.news.findUnique({
    where: { id: Number(id) },
    include: {
      author: {
        select: { id: true, fullName: true },
      },
    },
  });
  if (!news) return res.status(404).json({ error: 'Новость не найдена' });
  res.json(news);
};

// Создать новость (только ADMIN)
export const createNews = async (req: Request, res: Response) => {
  const { title, content, imageUrl } = req.body;
  const authorId = (req as any).user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Название и содержание обязательны' });
  }

  const news = await prisma.news.create({
    data: {
      title,
      content,
      imageUrl: imageUrl || null,
      authorId,
    },
  });
  res.status(201).json(news);
};

// Обновить новость (только ADMIN)
export const updateNews = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, imageUrl } = req.body;

  const existing = await prisma.news.findUnique({
    where: { id: Number(id) },
  });
  if (!existing) return res.status(404).json({ error: 'Новость не найдена' });

  const updated = await prisma.news.update({
    where: { id: Number(id) },
    data: {
      title: title || existing.title,
      content: content || existing.content,
      imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
    },
  });
  res.json(updated);
};

// Удалить новость (только ADMIN)
export const deleteNews = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.news.findUnique({
    where: { id: Number(id) },
  });
  if (!existing) return res.status(404).json({ error: 'Новость не найдена' });

  await prisma.news.delete({ where: { id: Number(id) } });
  res.status(204).send();
};

// ===== Загрузка изображения для новости =====
export const uploadImage = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const imageUrl = `/uploads/news/${req.file.filename}`;
  res.json({ imageUrl });
};