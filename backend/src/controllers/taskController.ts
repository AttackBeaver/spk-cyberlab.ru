import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getTasksByTopic = async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const tasks = await prisma.task.findMany({
    where: { topicId: Number(topicId) },
    orderBy: { id: 'asc' },
  });
  res.json(tasks);
};

export const createTask = async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const { title, description, type, solutionTemplate, difficulty, timeLimit, attemptsLimit } = req.body;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const topic = await prisma.topic.findUnique({
    where: { id: Number(topicId) },
    include: { module: { include: { course: true } } },
  });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  if (topic.module.course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      type,
      solutionTemplate,
      difficulty: difficulty || 1,
      timeLimit,
      attemptsLimit,
      topicId: Number(topicId),
    },
  });
  res.status(201).json(task);
};

export const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, type, solutionTemplate, difficulty, timeLimit, attemptsLimit } = req.body;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const task = await prisma.task.findUnique({
    where: { id: Number(id) },
    include: { topic: { include: { module: { include: { course: true } } } } },
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.topic.module.course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.task.update({
    where: { id: Number(id) },
    data: { title, description, type, solutionTemplate, difficulty, timeLimit, attemptsLimit },
  });
  res.json(updated);
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const task = await prisma.task.findUnique({
    where: { id: Number(id) },
    include: { topic: { include: { module: { include: { course: true } } } } },
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.topic.module.course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.task.delete({ where: { id: Number(id) } });
  res.status(204).send();
};