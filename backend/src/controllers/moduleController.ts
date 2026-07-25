import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getModulesByCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const modules = await prisma.module.findMany({
    where: { courseId: Number(courseId) },
    include: { topics: { include: { tasks: true } } },
    orderBy: { order: 'asc' },
  });
  res.json(modules);
};

export const createModule = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title, description, order } = req.body;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  // Проверка, что курс существует и пользователь имеет права
  const course = await prisma.course.findUnique({
    where: { id: Number(courseId) },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const module = await prisma.module.create({
    data: {
      title,
      description,
      order: order || 0,
      courseId: Number(courseId),
    },
  });
  res.status(201).json(module);
};

export const updateModule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, order } = req.body;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const module = await prisma.module.findUnique({
    where: { id: Number(id) },
    include: { course: true },
  });
  if (!module) return res.status(404).json({ error: 'Module not found' });
  if (module.course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.module.update({
    where: { id: Number(id) },
    data: { title, description, order },
  });
  res.json(updated);
};

export const deleteModule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const module = await prisma.module.findUnique({
    where: { id: Number(id) },
    include: { course: true },
  });
  if (!module) return res.status(404).json({ error: 'Module not found' });
  if (module.course.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.module.delete({ where: { id: Number(id) } });
  res.status(204).send();
};