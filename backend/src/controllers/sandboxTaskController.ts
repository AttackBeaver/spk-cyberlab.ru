import { Request, Response } from 'express';
import prisma from '../utils/prisma';

const isTeacherOrAdmin = (role: string) => role === 'TEACHER' || role === 'ADMIN';

export const getTasks = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { type, difficulty, groupId } = req.query;

  const where: any = {};

  if (type) where.type = type;
  if (difficulty) where.difficulty = parseInt(difficulty as string);

  if (user.role === 'STUDENT') {
    const userWithGroup = await prisma.user.findUnique({
      where: { id: user.id },
      select: { groupId: true },
    });
    if (!userWithGroup?.groupId) {
      return res.json([]);
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
    htmlTemplate,
    expectedResult,
    config,
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Название и описание обязательны' });
  }

  // @ts-ignore – поле config существует в схеме и БД, но TypeScript его не видит
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
      htmlTemplate: htmlTemplate || null,
      expectedResult: expectedResult || null,
      config: config || null,
      createdBy: user.id,
    },
  });

  res.status(201).json(task);
};

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
    htmlTemplate,
    expectedResult,
    config,
  } = req.body;

  const existing = await prisma.sandboxTask.findUnique({
    where: { id: Number(id) },
    select: { createdBy: true },
  });
  if (!existing) return res.status(404).json({ error: 'Задание не найдено' });

  if (user.role !== 'ADMIN' && existing.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете редактировать это задание' });
  }

  // @ts-ignore – поле config существует в схеме и БД, но TypeScript его не видит
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
      htmlTemplate: htmlTemplate || null,
      expectedResult: expectedResult || null,
      config: config !== undefined ? config : existing.config,
    },
  });

  res.json(updated);
};

export const deleteTask = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const { id } = req.params;
  const taskId = Number(id);

  const existing = await prisma.sandboxTask.findUnique({
    where: { id: taskId },
    select: { createdBy: true },
  });
  if (!existing) return res.status(404).json({ error: 'Задание не найдено' });

  if (user.role !== 'ADMIN' && existing.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете удалить это задание' });
  }

  await prisma.$transaction([
    prisma.sandboxAttempt.deleteMany({ where: { taskId } }),
    prisma.sandboxTaskGroup.deleteMany({ where: { taskId } }),
    prisma.sandboxEnvironment.deleteMany({ where: { taskId } }),
    prisma.sandboxTask.delete({ where: { id: taskId } }),
  ]);

  res.status(204).send();
};

export const assignTaskToGroups = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const { id } = req.params;
  const { groupIds } = req.body;

  if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
    return res.status(400).json({ error: 'Укажите хотя бы одну группу' });
  }

  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(id) },
    select: { createdBy: true },
  });
  if (!task) return res.status(404).json({ error: 'Задание не найдено' });

  if (user.role !== 'ADMIN' && task.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете назначать это задание' });
  }

  await prisma.sandboxTaskGroup.deleteMany({
    where: { taskId: Number(id) },
  });

  const assignments = groupIds.map((groupId: number) => ({
    taskId: Number(id),
    groupId,
  }));

  await prisma.sandboxTaskGroup.createMany({
    data: assignments,
  });

  res.json({ message: 'Назначения обновлены' });
};

export const getTaskGroups = async (req: Request, res: Response) => {
  const { id } = req.params;
  const groups = await prisma.sandboxTaskGroup.findMany({
    where: { taskId: Number(id) },
    include: { group: { select: { id: true, name: true } } },
  });
  res.json(groups);
};