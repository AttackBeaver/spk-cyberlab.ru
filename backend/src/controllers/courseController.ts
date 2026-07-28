import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Получить все курсы (для всех пользователей)
export const getAllCourses = async (req: Request, res: Response) => {
  const courses = await prisma.course.findMany({
    include: { teacher: { select: { fullName: true } } }, // email удалён
  });
  res.json(courses);
};

// Получить курс по ID с модулями и темами
export const getCourseById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const course = await prisma.course.findUnique({
    where: { id: Number(id) },
    include: {
      teacher: { select: { fullName: true } }, // email удалён
      modules: {
        include: {
          topics: { include: { tasks: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
};

// Создать курс (только TEACHER или ADMIN)
export const createCourse = async (req: Request, res: Response) => {
  const { title, description, teacherId } = req.body;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  let finalTeacherId = userId;
  if (userRole === 'ADMIN' && teacherId) {
    const teacher = await prisma.user.findUnique({
      where: { id: Number(teacherId) },
    });
    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'ADMIN')) {
      return res.status(400).json({ error: 'Указанный пользователь не является преподавателем или администратором' });
    }
    finalTeacherId = Number(teacherId);
  }

  try {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        teacherId: finalTeacherId,
      },
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create course' });
  }
};

// Обновить курс (владелец или ADMIN)
export const updateCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const existing = await prisma.course.findUnique({ where: { id: Number(id) } });
  if (!existing) return res.status(404).json({ error: 'Course not found' });

  if (existing.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await prisma.course.update({
    where: { id: Number(id) },
    data: { title, description },
  });
  res.json(updated);
};

// Удалить курс (владелец или ADMIN)
export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const existing = await prisma.course.findUnique({ where: { id: Number(id) } });
  if (!existing) return res.status(404).json({ error: 'Course not found' });

  if (existing.teacherId !== userId && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.course.delete({ where: { id: Number(id) } });
  res.status(204).send();
};

export const getTeacherCourses = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const courses = await prisma.course.findMany({
    where: { teacherId: userId },
    include: { teacher: { select: { fullName: true } } }, // email удалён
    orderBy: { createdAt: 'desc' },
  });
  res.json(courses);
};

export const getMyCourses = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const courses = await prisma.course.findMany({
    where: { teacherId: userId },
    include: {
      teacher: { select: { fullName: true } }, // email удалён
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(courses);
};