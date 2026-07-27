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

// ===== Вспомогательная функция для определения категории =====
const getCategoryFromFile = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
    return 'PHOTO';
  } else if (['.mp4', '.webm', '.ogg', '.avi', '.mov'].includes(ext)) {
    return 'VIDEO';
  }
  return 'OTHER';
};

// ===== Основные функции =====

// Получить мемы с фильтрацией, поиском и сортировкой (публично)
export const getMemes = async (req: Request, res: Response) => {
  const { category, search, sort, page = '1', limit = '12' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 12;
  const skip = (pageNum - 1) * limitNum;

  // Базовый фильтр: только одобренные
  const where: any = { approved: true };

  // Фильтрация по категории
  if (category && category !== 'ALL') {
    where.category = category;
  }

  // Поиск по названию или автору
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { author: { fullName: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  // Сортировка
  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'popular') {
    orderBy = { likes: 'desc' };
  } else if (sort === 'date') {
    orderBy = { createdAt: 'desc' };
  }

  const [memes, total] = await Promise.all([
    prisma.meme.findMany({
      where,
      include: {
        author: { select: { id: true, fullName: true } },
        _count: {
          select: { votes: true },
        },
      },
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.meme.count({ where }),
  ]);

  // Дополнительно вычисляем лайки/дизлайки через агрегацию
  // (можно было бы хранить счетчики, но для простоты вычисляем)
  const memesWithStats = await Promise.all(
    memes.map(async (meme) => {
      const likes = await prisma.memeVote.count({
        where: { memeId: meme.id, voteType: 'LIKE' },
      });
      const dislikes = await prisma.memeVote.count({
        where: { memeId: meme.id, voteType: 'DISLIKE' },
      });
      return {
        ...meme,
        likes,
        dislikes,
      };
    })
  );

  res.json({
    data: memesWithStats,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
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

// Создать мем с загруженным файлом (авторизованный пользователь)
export const createMemeWithFile = async (req: Request, res: Response) => {
  const { title, category: categoryInput } = req.body;
  const authorId = (req as any).user.id;
  const userRole = (req as any).user.role;

  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const imageUrl = `/uploads/memes/${req.file.filename}`;
  const category = categoryInput || getCategoryFromFile(req.file.filename);
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

// === Голосование ===
export const voteMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const { voteType } = req.body; // 'LIKE' или 'DISLIKE'

  if (!['LIKE', 'DISLIKE'].includes(voteType)) {
    return res.status(400).json({ error: 'Некорректный тип голоса' });
  }

  // Проверяем существование мема
  const meme = await prisma.meme.findUnique({
    where: { id: Number(id) },
    select: { id: true },
  });
  if (!meme) return res.status(404).json({ error: 'Мем не найден' });

  // Проверяем, голосовал ли пользователь уже за этот мем
  const existingVote = await prisma.memeVote.findUnique({
    where: {
      userId_memeId: {
        userId,
        memeId: Number(id),
      },
    },
  });

  if (existingVote) {
    // Если голос уже был, удаляем его (отмена голоса)
    await prisma.memeVote.delete({
      where: {
        userId_memeId: {
          userId,
          memeId: Number(id),
        },
      },
    });
    // Возвращаем обновлённые счетчики
    const likes = await prisma.memeVote.count({ where: { memeId: Number(id), voteType: 'LIKE' } });
    const dislikes = await prisma.memeVote.count({ where: { memeId: Number(id), voteType: 'DISLIKE' } });
    return res.json({ message: 'Голос отменён', likes, dislikes });
  } else {
    // Создаём новый голос
    await prisma.memeVote.create({
      data: {
        userId,
        memeId: Number(id),
        voteType: voteType as any,
      },
    });
    const likes = await prisma.memeVote.count({ where: { memeId: Number(id), voteType: 'LIKE' } });
    const dislikes = await prisma.memeVote.count({ where: { memeId: Number(id), voteType: 'DISLIKE' } });
    return res.json({ message: 'Голос учтён', likes, dislikes });
  }
};

// === Рейтинг авторов (по количеству одобренных мемов) ===
export const getAuthorRanking = async (req: Request, res: Response) => {
  const ranking = await prisma.user.findMany({
    where: {
      memes: {
        some: { approved: true },
      },
    },
    select: {
      id: true,
      fullName: true,
      _count: {
        select: {
          memes: {
            where: { approved: true },
          },
        },
      },
    },
    orderBy: {
      memes: {
        _count: 'desc',
      },
    },
    take: 20,
  });
  res.json(ranking);
};