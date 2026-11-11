import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';

// Создание группы (только ADMIN)
export const createGroup = async (req: Request, res: Response) => {
  const { name, prefix, year } = req.body;
  try {
    const group = await prisma.group.create({
      data: { name, prefix, year: year || new Date().getFullYear() },
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: 'Группа с таким именем уже существует' });
  }
};

// Добавление студентов в группу (массово)
export const addStudents = async (req: Request, res: Response) => {
  const { groupId, students } = req.body; // students: [{ fullName, studentNumber }]

  const group = await prisma.group.findUnique({
    where: { id: Number(groupId) },
  });
  if (!group) return res.status(404).json({ error: 'Группа не найдена' });

  const results = [];
  for (const student of students) {
    const { fullName, studentNumber } = student;
    const existing = await prisma.user.findFirst({
      where: {
        groupId: Number(groupId),
        studentNumber: Number(studentNumber),
      },
    });
    if (existing) {
      results.push({ studentNumber, status: 'already exists', id: existing.id });
      continue;
    }
    const newUser = await prisma.user.create({
      data: {
        fullName,
        studentNumber: Number(studentNumber),
        groupId: Number(groupId),
        role: 'STUDENT',
        username: `temp-${Date.now()}-${studentNumber}`,
      },
    });
    results.push({ studentNumber, status: 'created', id: newUser.id });
  }
  res.status(201).json(results);
};

// Создание преподавателя (только ADMIN)
export const createTeacher = async (req: Request, res: Response) => {
  const { username, fullName, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const teacher = await prisma.user.create({
      data: {
        username,
        fullName,
        passwordHash: hashedPassword,
        role: 'TEACHER',
      },
    });
    res.status(201).json({ id: teacher.id, username: teacher.username, role: teacher.role });
  } catch (error) {
    res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
  }
};

// Сброс пароля (для администратора)
export const resetPassword = async (req: Request, res: Response) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Не указаны логин или новый пароль' });
  }

  const user = await prisma.user.findFirst({
    where: { username },
  });

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashed },
  });

  res.json({ message: 'Пароль сброшен' });
};

// Получить всех пользователей (с группами)
export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: {
      group: true,
    },
    orderBy: { id: 'asc' },
  });
  res.json(users);
};

// Получить все группы с количеством студентов
export const getAllGroups = async (req: Request, res: Response) => {
  const groups = await prisma.group.findMany({
    include: {
      students: {
        select: { id: true, fullName: true, studentNumber: true, username: true },
      },
    },
    orderBy: { name: 'asc' },
  });
  res.json(groups);
};

// Получить все курсы (с преподавателями)
export const getAllCourses = async (req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    include: {
      teacher: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(courses);
};

// Удаление пользователя (только ADMIN) – логи НЕ удаляем, обнуляем userId
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = (req as any).user.id;

  if (Number(id) === currentUserId) {
    return res.status(403).json({ error: 'Нельзя удалить самого себя' });
  }

  const userId = Number(id);

  try {
    // Используем транзакцию для удаления всех зависимостей
    await prisma.$transaction(async (tx) => {
      // 1. Удаляем записи с обязательной связью
      await tx.taskAttempt.deleteMany({ where: { userId } });
      await tx.meme.deleteMany({ where: { authorId: userId } });
      await tx.userAchievement.deleteMany({ where: { userId } });
      await tx.memeVote.deleteMany({ where: { userId } });
      await tx.sandboxAttempt.deleteMany({ where: { userId } });
      await tx.sandboxSession.deleteMany({ where: { userId } });
      await tx.sandboxTask.deleteMany({ where: { createdBy: userId } });
      await tx.news.deleteMany({ where: { authorId: userId } });
      await tx.bugReport.deleteMany({ where: { userId } });

      // 2. Аудит-логи НЕ удаляем — обнуляем userId (userId в Log nullable)
      //    В UI для старых логов будет "Удалённый пользователь"
      await tx.log.updateMany({
        where: { userId },
        data: { userId: null },
      });

      // 3. Для опциональных связей устанавливаем null вместо удаления
      await tx.bugReport.updateMany({
        where: { respondedBy: userId },
        data: { respondedBy: null, adminResponse: null, respondedAt: null },
      });
      await tx.sandboxStudentReport.updateMany({
        where: { reviewedBy: userId },
        data: { reviewedBy: null, reviewedAt: null },
      });

      // 4. Удаляем курсы, созданные пользователем
      await tx.course.deleteMany({ where: { teacherId: userId } });

      // 5. Удаляем самого пользователя
      await tx.user.delete({ where: { id: userId } });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: 'Не удалось удалить пользователя' });
  }
};

// Удаление группы (только ADMIN)
export const deleteGroup = async (req: Request, res: Response) => {
  const { id } = req.params;
  const groupId = Number(id);

  const studentCount = await prisma.user.count({
    where: { groupId },
  });

  if (studentCount > 0) {
    return res.status(400).json({
      error: 'Нельзя удалить группу, в которой есть студенты. Сначала удалите или переместите студентов.'
    });
  }

  await prisma.group.delete({
    where: { id: groupId },
  });

  res.status(204).send();
};

// Редактирование пользователя (только ADMIN)
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, fullName } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
  });

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  if (username) {
    const existing = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: Number(id) },
      },
    });
    if (existing) {
      return res.status(400).json({ error: 'Логин уже занят' });
    }
  }

  const updated = await prisma.user.update({
    where: { id: Number(id) },
    data: {
      username: username || user.username,
      fullName: fullName || user.fullName,
    },
  });

  res.json(updated);
};

// ===== НОВОЕ: Получить логи аудита (только ADMIN) =====
/**
 * GET /api/admin/logs
 *
 * Query-параметры (все опциональны):
 *   - userId   — ID пользователя (точное совпадение)
 *   - action   — тип действия (точное совпадение, например LOGIN)
 *   - dateFrom — ISO-дата, начало периода (включительно)
 *   - dateTo   — ISO-дата, конец периода (включительно)
 *   - search   — подстрока для поиска в details (регистронезависимо)
 *   - page     — номер страницы (по умолчанию 1)
 *   - limit    — записей на страницу (по умолчанию 50, максимум 200)
 *
 * Ответ:
 *   { logs, total, page, limit, pages, actions }
 *   actions — список уникальных типов действий в БД (для dropdown фильтра)
 */
export const getLogs = async (req: Request, res: Response) => {
  const {
    userId,
    action,
    dateFrom,
    dateTo,
    search,
    page = '1',
    limit = '50',
  } = req.query as Record<string, string | undefined>;

  // Пагинация
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  // Собираем условия WHERE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (userId && userId !== 'all') {
    const id = Number(userId);
    if (!isNaN(id)) where.userId = id;
  }

  if (action && action !== 'all') {
    where.action = action;
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      if (!isNaN(d.getTime())) where.createdAt.gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      if (!isNaN(d.getTime())) where.createdAt.lte = d;
    }
  }

  if (search && search.trim()) {
    where.details = { contains: search.trim(), mode: 'insensitive' };
  }

  // Параллельно: логи, общее количество, список уникальных actions
  const [logs, total, actionsResult] = await Promise.all([
    prisma.log.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.log.count({ where }),
    prisma.log.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    }),
  ]);

  res.json({
    logs,
    total,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(total / limitNum),
    actions: actionsResult.map((a) => a.action),
  });
};