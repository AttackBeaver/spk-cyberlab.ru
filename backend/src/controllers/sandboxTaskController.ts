import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ===== Вспомогательная функция: проверка прав доступа =====
// Только TEACHER или ADMIN могут создавать/редактировать/удалять задания
const isTeacherOrAdmin = (role: string) => role === 'TEACHER' || role === 'ADMIN';

// ===== CRUD для заданий =====

// Получить список всех заданий (для преподавателя/админа – все, для студента – только доступные)
export const getTasks = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { type, difficulty, groupId } = req.query;

  // Базовый фильтр
  const where: any = {};

  if (type) where.type = type;
  if (difficulty) where.difficulty = parseInt(difficulty as string);

  // Если пользователь – студент, показываем только задания, назначенные его группе
  if (user.role === 'STUDENT') {
    const userWithGroup = await prisma.user.findUnique({
      where: { id: user.id },
      select: { groupId: true },
    });
    if (!userWithGroup?.groupId) {
      return res.json([]); // нет группы – нет заданий
    }
    where.groups = {
      some: { groupId: userWithGroup.groupId },
    };
  }

  const tasks = await prisma.sandboxTask.findMany({
    where,
    include: {
      creator: { select: { id: true, fullName: true } },
      groups: {
        include: { group: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(tasks);
};

// Получить одно задание по ID (с проверкой доступа)
export const getTaskById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(id) },
    include: {
      creator: { select: { id: true, fullName: true } },
      groups: {
        include: { group: { select: { id: true, name: true } } },
      },
    },
  });
  if (!task) return res.status(404).json({ error: 'Задание не найдено' });

  // Проверка доступа для студента
  if (user.role === 'STUDENT') {
    const userWithGroup = await prisma.user.findUnique({
      where: { id: user.id },
      select: { groupId: true },
    });
    const hasAccess = task.groups.some(g => g.groupId === userWithGroup?.groupId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Доступ запрещён' });
    }
  }

  res.json(task);
};

// Создать задание (только TEACHER или ADMIN)
export const createTask = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const {
    title,
    description,
    instructions,
    type,
    difficulty,
    timeLimit,
    attemptsLimit,
    points,
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Название и описание обязательны' });
  }

  const task = await prisma.sandboxTask.create({
    data: {
      title,
      description,
      instructions,
      type: type || 'CUSTOM',
      difficulty: difficulty || 1,
      timeLimit: timeLimit || null,
      attemptsLimit: attemptsLimit || null,
      points: points || 0,
      createdBy: user.id,
    },
  });

  res.status(201).json(task);
};

// Обновить задание (только TEACHER или ADMIN, и только свои)
export const updateTask = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const { id } = req.params;
  const {
    title,
    description,
    instructions,
    type,
    difficulty,
    timeLimit,
    attemptsLimit,
    points,
  } = req.body;

  const existing = await prisma.sandboxTask.findUnique({
    where: { id: Number(id) },
    select: { createdBy: true },
  });
  if (!existing) return res.status(404).json({ error: 'Задание не найдено' });

  // Проверка: только создатель или ADMIN может редактировать
  if (user.role !== 'ADMIN' && existing.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете редактировать это задание' });
  }

  const updated = await prisma.sandboxTask.update({
    where: { id: Number(id) },
    data: {
      title,
      description,
      instructions,
      type,
      difficulty,
      timeLimit,
      attemptsLimit,
      points,
    },
  });

  res.json(updated);
};

// Удалить задание (только TEACHER или ADMIN, и только свои)
export const deleteTask = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const { id } = req.params;

  const existing = await prisma.sandboxTask.findUnique({
    where: { id: Number(id) },
    select: { createdBy: true },
  });
  if (!existing) return res.status(404).json({ error: 'Задание не найдено' });

  if (user.role !== 'ADMIN' && existing.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете удалить это задание' });
  }

  await prisma.sandboxTask.delete({ where: { id: Number(id) } });
  res.status(204).send();
};

// ===== Назначение задания группам =====
export const assignTaskToGroups = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const { id } = req.params;
  const { groupIds } = req.body; // массив чисел

  if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
    return res.status(400).json({ error: 'Укажите хотя бы одну группу' });
  }

  // Проверяем существование задания
  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(id) },
    select: { createdBy: true },
  });
  if (!task) return res.status(404).json({ error: 'Задание не найдено' });

  // Проверяем права
  if (user.role !== 'ADMIN' && task.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете назначать это задание' });
  }

  // Удаляем старые назначения (если нужна полная замена)
  await prisma.sandboxTaskGroup.deleteMany({
    where: { taskId: Number(id) },
  });

  // Создаём новые назначения
  const assignments = groupIds.map((groupId: number) => ({
    taskId: Number(id),
    groupId,
  }));

  await prisma.sandboxTaskGroup.createMany({
    data: assignments,
  });

  res.json({ message: 'Назначения обновлены' });
};

// Получить группы, которым назначено задание
export const getTaskGroups = async (req: Request, res: Response) => {
  const { id } = req.params;
  const groups = await prisma.sandboxTaskGroup.findMany({
    where: { taskId: Number(id) },
    include: { group: { select: { id: true, name: true } } },
  });
  res.json(groups);
};