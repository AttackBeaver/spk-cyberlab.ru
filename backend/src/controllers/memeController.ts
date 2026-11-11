import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
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

// ===== Вспомогательные =====
const getCategoryFromFile = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
    return 'PHOTO';
  } else if (['.mp4', '.webm', '.ogg', '.avi', '.mov'].includes(ext)) {
    return 'VIDEO';
  }
  return 'OTHER';
};

const MEMES_DIR = path.join(__dirname, '../../uploads/memes');

// ===== Публичные методы =====

// Публичный список: только одобренные, не отклонённые, не в корзине
export const getMemes = async (req: Request, res: Response) => {
  const { category, search, sort, page = '1', limit = '12' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 12;
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    approved: true,
    rejectedAt: null,
    deletedAt: null,
  };

  if (category && category !== 'ALL') {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { author: { fullName: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

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
        _count: { select: { votes: true } },
      },
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.meme.count({ where }),
  ]);

  const memesWithStats = await Promise.all(
    memes.map(async (meme) => {
      const likes = await prisma.memeVote.count({
        where: { memeId: meme.id, voteType: 'LIKE' },
      });
      const dislikes = await prisma.memeVote.count({
        where: { memeId: meme.id, voteType: 'DISLIKE' },
      });
      return { ...meme, likes, dislikes };
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

// Мемы на модерации (только pending: approved=false, rejected=null, deleted=null)
export const getPendingMemes = async (req: Request, res: Response) => {
  const memes = await prisma.meme.findMany({
    where: {
      approved: false,
      rejectedAt: null,
      deletedAt: null,
    },
    include: { author: { select: { fullName: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(memes);
};

// ==== Админский список: все мемы с фильтром по статусу ====
export const getAllMemesAdmin = async (req: Request, res: Response) => {
  const {
    status = 'all',
    search,
    page = '1',
    limit = '50',
  } = req.query as Record<string, string | undefined>;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  switch (status) {
    case 'pending':
      where.approved = false;
      where.rejectedAt = null;
      where.deletedAt = null;
      break;
    case 'approved':
      where.approved = true;
      where.deletedAt = null;
      break;
    case 'rejected':
      where.rejectedAt = { not: null };
      where.deletedAt = null;
      break;
    case 'trash':
      where.deletedAt = { not: null };
      break;
    default: // 'all'
      where.deletedAt = null;
  }

  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: 'insensitive' } },
      { author: { fullName: { contains: search.trim(), mode: 'insensitive' } } },
    ];
  }

  const [memes, total, counts] = await Promise.all([
    prisma.meme.findMany({
      where,
      include: { author: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.meme.count({ where }),
    Promise.all([
      prisma.meme.count({ where: { deletedAt: null } }),                                     // all active
      prisma.meme.count({ where: { approved: false, rejectedAt: null, deletedAt: null } }),  // pending
      prisma.meme.count({ where: { approved: true, deletedAt: null } }),                     // approved
      prisma.meme.count({ where: { rejectedAt: { not: null }, deletedAt: null } }),          // rejected
      prisma.meme.count({ where: { deletedAt: { not: null } } }),                            // trash
    ]),
  ]);

  const [allCount, pendingCount, approvedCount, rejectedCount, trashCount] = counts;

  res.json({
    memes,
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum),
    counts: {
      all: allCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      trash: trashCount,
    },
  });
};

// ===== Создание =====
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

// ===== Модерация =====

// Одобрить (очищаем rejected-поля, если мем был отклонён)
export const approveMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = (req as any).user.id;

  const meme = await prisma.meme.findUnique({ where: { id: Number(id) } });
  if (!meme) return res.status(404).json({ error: 'Мем не найден' });
  if (meme.deletedAt) {
    return res.status(400).json({ error: 'Мем в корзине — сначала восстановите' });
  }

  const updated = await prisma.meme.update({
    where: { id: Number(id) },
    data: {
      approved: true,
      approvedBy: adminId,
      rejectedAt: null,
      rejectedBy: null,
    },
  });
  res.json(updated);
};

// Отклонить (soft: не удаляем, помечаем rejectedAt)
export const rejectMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = (req as any).user.id;

  const meme = await prisma.meme.findUnique({ where: { id: Number(id) } });
  if (!meme) return res.status(404).json({ error: 'Мем не найден' });
  if (meme.deletedAt) {
    return res.status(400).json({ error: 'Мем в корзине' });
  }

  await prisma.meme.update({
    where: { id: Number(id) },
    data: {
      approved: false,
      approvedBy: null,
      rejectedAt: new Date(),
      rejectedBy: adminId,
    },
  });
  res.status(204).send();
};

// В корзину (soft-delete)
export const deleteMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = (req as any).user.id;

  const meme = await prisma.meme.findUnique({ where: { id: Number(id) } });
  if (!meme) return res.status(404).json({ error: 'Мем не найден' });
  if (meme.deletedAt) {
    return res.status(400).json({ error: 'Мем уже в корзине' });
  }

  await prisma.meme.update({
    where: { id: Number(id) },
    data: {
      deletedAt: new Date(),
      deletedBy: adminId,
    },
  });
  res.status(204).send();
};

// Восстановить из корзины
export const restoreMeme = async (req: Request, res: Response) => {
  const { id } = req.params;

  const meme = await prisma.meme.findUnique({ where: { id: Number(id) } });
  if (!meme) return res.status(404).json({ error: 'Мем не найден' });
  if (!meme.deletedAt) {
    return res.status(400).json({ error: 'Мем не в корзине' });
  }

  const updated = await prisma.meme.update({
    where: { id: Number(id) },
    data: {
      deletedAt: null,
      deletedBy: null,
    },
  });
  res.json(updated);
};

// Окончательное удаление (БД + файл)
export const hardDeleteMeme = async (req: Request, res: Response) => {
  const { id } = req.params;

  const meme = await prisma.meme.findUnique({ where: { id: Number(id) } });
  if (!meme) return res.status(404).json({ error: 'Мем не найден' });

  // Удаляем файл с диска (если есть и если он внутри uploads/memes)
  try {
    const fileName = path.basename(meme.imageUrl);
    const filePath = path.join(MEMES_DIR, fileName);
    if (filePath.startsWith(MEMES_DIR) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err: unknown) {
    console.error('[hardDeleteMeme] файл не удалён:', err);
    // продолжаем — запись в БД всё равно удалим
  }

  await prisma.meme.delete({ where: { id: Number(id) } });
  res.status(204).send();
};

// ===== Голосование =====
export const voteMeme = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const { voteType } = req.body;

  if (!['LIKE', 'DISLIKE'].includes(voteType)) {
    return res.status(400).json({ error: 'Некорректный тип голоса' });
  }

  const memeId = Number(id);

  const meme = await prisma.meme.findUnique({
    where: { id: memeId },
    select: { id: true, approved: true, rejectedAt: true, deletedAt: true },
  });
  if (!meme) return res.status(404).json({ error: 'Мем не найден' });
  if (!meme.approved || meme.rejectedAt || meme.deletedAt) {
    return res.status(400).json({ error: 'Голосовать можно только за одобренные мемы' });
  }

  const existingVote = await prisma.memeVote.findUnique({
    where: { userId_memeId: { userId, memeId } },
  });

  // Меняем голос
  if (existingVote) {
    await prisma.memeVote.delete({
      where: { userId_memeId: { userId, memeId } },
    });
  } else {
    await prisma.memeVote.create({
      data: { userId, memeId, voteType: voteType as any },
    });
  }

  // Пересчитываем и синхронизируем денормализованные поля
  const [likes, dislikes] = await Promise.all([
    prisma.memeVote.count({ where: { memeId, voteType: 'LIKE' } }),
    prisma.memeVote.count({ where: { memeId, voteType: 'DISLIKE' } }),
  ]);

  await prisma.meme.update({
    where: { id: memeId },
    data: { likes, dislikes },
  });

  return res.json({
    message: existingVote ? 'Голос отменён' : 'Голос учтён',
    likes,
    dislikes,
  });
};

// ===== Рейтинг авторов (по одобренным) =====
export const getAuthorRanking = async (req: Request, res: Response) => {
  const ranking = await prisma.user.findMany({
    where: {
      memes: {
        some: {
          approved: true,
          rejectedAt: null,
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      _count: {
        select: {
          memes: {
            where: {
              approved: true,
              rejectedAt: null,
              deletedAt: null,
            },
          },
        },
      },
    },
    orderBy: { memes: { _count: 'desc' } },
    take: 20,
  });
  res.json(ranking);
};

// ===== Экспорт всех мемов в ZIP =====
// GET /api/memes/export?includeRejected=true&includeTrash=false
export const exportMemesZip = async (req: Request, res: Response) => {
  const { includeRejected = 'true', includeTrash = 'false' } = req.query as Record<string, string | undefined>;

  const where: any = {};
  if (includeTrash !== 'true') where.deletedAt = null;
  if (includeRejected === 'false') where.rejectedAt = null;

  const memes = await prisma.meme.findMany({
    where,
    include: {
      author: { select: { id: true, fullName: true, username: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const zipName = `memes-${dateStr}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });

  archive.on('error', (err) => {
    console.error('[exportMemesZip] archive error:', err);
    try { res.status(500).end(); } catch { /* ignore */ }
  });

  archive.on('warning', (err) => {
    console.warn('[exportMemesZip] archive warning:', err);
  });

  // Клиент отвалился — прерываем
  res.on('close', () => {
    if (!res.writableEnded) archive.abort();
  });

  archive.pipe(res);

  // 1. Метаданные (JSON)
  const metaJson = memes.map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    imageUrl: m.imageUrl,
    fileName: path.basename(m.imageUrl),
    authorId: m.authorId,
    authorFullName: m.author?.fullName ?? null,
    authorUsername: m.author?.username ?? null,
    approved: m.approved,
    rejectedAt: m.rejectedAt?.toISOString() ?? null,
    deletedAt: m.deletedAt?.toISOString() ?? null,
    likes: m.likes,
    dislikes: m.dislikes,
    createdAt: m.createdAt.toISOString(),
  }));

  archive.append(JSON.stringify(metaJson, null, 2), { name: 'memes.json' });

  // 2. CSV (с BOM для Excel)
  const csvEscape = (val: unknown): string => {
    const s = val === null || val === undefined ? '' : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csvHeaders = [
    'id', 'title', 'category', 'fileName', 'imageUrl',
    'authorId', 'authorFullName', 'authorUsername',
    'approved', 'rejectedAt', 'deletedAt',
    'likes', 'dislikes', 'createdAt',
  ];
  const csvRows = metaJson.map((m) =>
    [
      m.id, m.title, m.category ?? '', m.fileName, m.imageUrl,
      m.authorId, m.authorFullName ?? '', m.authorUsername ?? '',
      m.approved, m.rejectedAt ?? '', m.deletedAt ?? '',
      m.likes, m.dislikes, m.createdAt,
    ].map(csvEscape).join(',')
  );
  const csv = '\uFEFF' + csvHeaders.join(',') + '\n' + csvRows.join('\n') + '\n';
  archive.append(csv, { name: 'memes.csv' });

  // 3. Файлы
  let added = 0;
  let missing = 0;
  for (const m of memes) {
    const fileName = path.basename(m.imageUrl);
    const filePath = path.join(MEMES_DIR, fileName);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: `files/${fileName}` });
      added++;
    } else {
      missing++;
    }
  }

  if (missing > 0) {
    archive.append(
      `Не найдено файлов на диске: ${missing}\nСписок файлов, отсутствующих на диске, см. в memes.json (сверьте fileName).\n`,
      { name: 'MISSING_FILES.txt' }
    );
  }

  console.log(`[exportMemesZip] ${memes.length} записей, файлов добавлено: ${added}, отсутствует: ${missing}`);

  await archive.finalize();
};