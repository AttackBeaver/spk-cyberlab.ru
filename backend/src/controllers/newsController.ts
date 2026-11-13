import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';

// ============================================================================
// Пути и константы
// ============================================================================
const NEWS_UPLOAD_DIR = path.join(__dirname, '../../uploads/news');

const MAX_FILES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];

// ============================================================================
// Multer
// ============================================================================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(NEWS_UPLOAD_DIR)) {
      fs.mkdirSync(NEWS_UPLOAD_DIR, { recursive: true });
    }
    cb(null, NEWS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'news-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый формат файла'));
    }
  },
});

export const uploadNewsImage = upload.single('image');
export const uploadNewsMedia = upload.array('media', MAX_FILES);

// ============================================================================
// Утилиты
// ============================================================================
type MediaType = 'IMAGE' | 'VIDEO';

interface MediaInput {
  url: string;
  type: MediaType;
  order: number;
}

const detectMediaType = (mimetype: string): MediaType =>
  mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';

const safeUnlink = (url: string | null | undefined): void => {
  if (!url) return;
  if (!url.startsWith('/uploads/news/')) return;
  const filename = url.slice('/uploads/news/'.length);
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return;
  }
  const fullPath = path.join(NEWS_UPLOAD_DIR, filename);
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    // не критично
  }
};

const validateMedia = (input: unknown): MediaInput[] | null => {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return null;
  if (input.length > MAX_FILES) return null;

  const result: MediaInput[] = [];
  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    if (typeof item !== 'object' || item === null) return null;
    const obj = item as Record<string, unknown>;

    const url = obj.url;
    const type = obj.type;
    if (typeof url !== 'string' || !url.startsWith('/uploads/news/')) return null;
    if (type !== 'IMAGE' && type !== 'VIDEO') return null;

    result.push({
      url,
      type,
      order: typeof obj.order === 'number' ? obj.order : i,
    });
  }
  return result;
};

// ============================================================================
// Чтение
// ============================================================================

export const getNews = async (_req: Request, res: Response) => {
  const news = await prisma.news.findMany({
    include: {
      author: { select: { id: true, fullName: true } },
      media: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(news);
};

export const getLatestNews = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const news = await prisma.news.findMany({
    include: {
      author: { select: { id: true, fullName: true } },
      media: { orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(news);
};

export const getNewsById = async (req: Request, res: Response) => {
  const newsId = Number(req.params.id);
  if (!Number.isFinite(newsId) || newsId <= 0) {
    return res.status(400).json({ error: 'Неверный ID' });
  }
  const news = await prisma.news.findUnique({
    where: { id: newsId },
    include: {
      author: { select: { id: true, fullName: true } },
      media: { orderBy: { order: 'asc' } },
    },
  });
  if (!news) return res.status(404).json({ error: 'Новость не найдена' });
  res.json(news);
};

/**
 * Список ID новостей, которые лайкнул текущий пользователь.
 * Используется фронтом для отрисовки состояния кнопки «лайк» на всех
 * новостях сразу (без N+1 запросов). Требует authenticate.
 */
export const getMyNewsVotes = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const votes = await prisma.newsVote.findMany({
    where: { userId },
    select: { newsId: true },
  });
  res.json({ newsIds: votes.map((v) => v.newsId) });
};

// ============================================================================
// Создание / обновление / удаление
// ============================================================================

export const createNews = async (req: Request, res: Response) => {
  const { title, content, imageUrl, media: mediaRaw } = req.body;
  const authorId = (req as any).user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Название и содержание обязательны' });
  }

  const media = validateMedia(mediaRaw);
  if (media === null) {
    return res.status(400).json({ error: 'Неверный формат медиафайлов (макс. 5)' });
  }

  const created = await prisma.news.create({
    data: {
      title: String(title),
      content: String(content),
      imageUrl: typeof imageUrl === 'string' && imageUrl.length > 0 ? imageUrl : null,
      authorId,
      ...(media.length > 0
        ? {
            media: {
              create: media.map((m, i) => ({
                url: m.url,
                type: m.type,
                order: m.order ?? i,
              })),
            },
          }
        : {}),
    },
    include: {
      author: { select: { id: true, fullName: true } },
      media: { orderBy: { order: 'asc' } },
    },
  });
  res.status(201).json(created);
};

export const updateNews = async (req: Request, res: Response) => {
  const newsId = Number(req.params.id);
  if (!Number.isFinite(newsId) || newsId <= 0) {
    return res.status(400).json({ error: 'Неверный ID' });
  }

  const { title, content, imageUrl, media: mediaRaw } = req.body;

  const existing = await prisma.news.findUnique({
    where: { id: newsId },
    include: { media: true },
  });
  if (!existing) return res.status(404).json({ error: 'Новость не найдена' });

  const mediaProvided = mediaRaw !== undefined;
  const parsedMedia = validateMedia(mediaRaw);
  if (mediaProvided && parsedMedia === null) {
    return res.status(400).json({ error: 'Неверный формат медиафайлов (макс. 5)' });
  }

  const filesToDelete: string[] = [];
  if (mediaProvided && parsedMedia !== null) {
    const newUrls = new Set(parsedMedia.map((m) => m.url));
    for (const old of existing.media) {
      if (!newUrls.has(old.url)) filesToDelete.push(old.url);
    }
  }

  await prisma.$transaction([
    prisma.news.update({
      where: { id: newsId },
      data: {
        title: title !== undefined ? String(title) : existing.title,
        content: content !== undefined ? String(content) : existing.content,
        imageUrl:
          imageUrl !== undefined
            ? (typeof imageUrl === 'string' && imageUrl.length > 0 ? imageUrl : null)
            : existing.imageUrl,
      },
    }),
    ...(mediaProvided && parsedMedia !== null
      ? [
          prisma.newsMedia.deleteMany({ where: { newsId } }),
          ...(parsedMedia.length > 0
            ? [
                prisma.newsMedia.createMany({
                  data: parsedMedia.map((m, i) => ({
                    newsId,
                    url: m.url,
                    type: m.type,
                    order: m.order ?? i,
                  })),
                }),
              ]
            : []),
        ]
      : []),
  ]);

  filesToDelete.forEach(safeUnlink);

  const updated = await prisma.news.findUnique({
    where: { id: newsId },
    include: {
      author: { select: { id: true, fullName: true } },
      media: { orderBy: { order: 'asc' } },
    },
  });
  res.json(updated);
};

export const deleteNews = async (req: Request, res: Response) => {
  const newsId = Number(req.params.id);
  if (!Number.isFinite(newsId) || newsId <= 0) {
    return res.status(400).json({ error: 'Неверный ID' });
  }

  const existing = await prisma.news.findUnique({
    where: { id: newsId },
    include: { media: true },
  });
  if (!existing) return res.status(404).json({ error: 'Новость не найдена' });

  await prisma.news.delete({ where: { id: newsId } });

  const files: string[] = [];
  if (existing.imageUrl) files.push(existing.imageUrl);
  for (const m of existing.media) files.push(m.url);
  files.forEach(safeUnlink);

  res.status(204).send();
};

// ============================================================================
// Голосование (только лайк, toggle)
// ============================================================================

export const voteNews = async (req: Request, res: Response) => {
  const newsId = Number(req.params.id);
  if (!Number.isFinite(newsId) || newsId <= 0) {
    return res.status(400).json({ error: 'Неверный ID' });
  }
  const userId = (req as any).user.id;

  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) return res.status(404).json({ error: 'Новость не найдена' });

  const existing = await prisma.newsVote.findUnique({
    where: { userId_newsId: { userId, newsId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.newsVote.delete({ where: { id: existing.id } }),
      prisma.news.update({
        where: { id: newsId },
        data: { likes: { decrement: 1 } },
      }),
    ]);
    const updated = await prisma.news.findUnique({
      where: { id: newsId },
      select: { likes: true },
    });
    return res.json({ liked: false, likes: updated?.likes ?? 0 });
  }

  await prisma.$transaction([
    prisma.newsVote.create({ data: { userId, newsId } }),
    prisma.news.update({
      where: { id: newsId },
      data: { likes: { increment: 1 } },
    }),
  ]);
  const updated = await prisma.news.findUnique({
    where: { id: newsId },
    select: { likes: true },
  });
  res.json({ liked: true, likes: updated?.likes ?? 0 });
};

// ============================================================================
// Загрузка файлов
// ============================================================================

export const uploadImage = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const imageUrl = `/uploads/news/${req.file.filename}`;
  res.json({ imageUrl });
};

export const uploadMediaHandler = (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Файлы не загружены' });
  }
  const media = files.map((file) => ({
    url: `/uploads/news/${file.filename}`,
    type: detectMediaType(file.mimetype),
  }));
  res.json({ media });
};