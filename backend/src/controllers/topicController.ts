import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getTopicsByModule = async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const topics = await prisma.topic.findMany({
    where: { moduleId: Number(moduleId) },
    include: { tasks: true },
    orderBy: { order: 'asc' },
  });
  res.json(topics);
};

export const createTopic = async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const { title, content, order } = req.body;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const module = await prisma.module.findUnique({
    where: { id: Number(moduleId) },
    include: { course: true },
  });
  if (!module) return res.status(404).json({ error: 'Module not found' });
  if (module.course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const topic = await prisma.topic.create({
    data: {
      title,
      content,
      order: order || 0,
      moduleId: Number(moduleId),
    },
  });
  res.status(201).json(topic);
};

export const updateTopic = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, order } = req.body;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const topic = await prisma.topic.findUnique({
    where: { id: Number(id) },
    include: { module: { include: { course: true } } },
  });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  if (topic.module.course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.topic.update({
    where: { id: Number(id) },
    data: { title, content, order },
  });
  res.json(updated);
};

export const deleteTopic = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const topic = await prisma.topic.findUnique({
    where: { id: Number(id) },
    include: { module: { include: { course: true } } },
  });
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  if (topic.module.course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.topic.delete({ where: { id: Number(id) } });
  res.status(204).send();
};