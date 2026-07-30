import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';

// ===== Multer настройка для PDF-файлов =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/lectures');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'lecture-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только PDF-файлы'));
    }
  },
});

export const uploadLectureFile = upload.single('file');

// ===== Вспомогательная проверка прав =====
const isTeacherOrAdmin = (role: string) => role === 'TEACHER' || role === 'ADMIN';

// ===== Получить все лекции по курсу (с проверкой доступа для студентов) =====
export const getLecturesByCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const user = (req as any).user;

  try {
    // Проверяем существование курса
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
      include: {
        groups: {
          select: { groupId: true },
        },
      },
    });
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }

    // Если студент — проверяем доступ к курсу через группы
    if (user.role === 'STUDENT') {
      const userWithGroup = await prisma.user.findUnique({
        where: { id: user.id },
        select: { groupId: true },
      });
      if (!userWithGroup?.groupId) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }
      const hasAccess = course.groups.some(g => g.groupId === userWithGroup.groupId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }
    }

    // Получаем лекции
    const lectures = await prisma.lecture.findMany({
      where: { courseId: Number(courseId) },
      orderBy: { order: 'asc' },
    });
    res.json(lectures);
  } catch (error) {
    console.error('Ошибка получения лекций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ===== Получить одну лекцию по ID (с проверкой доступа) =====
export const getLectureById = async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const user = (req as any).user;

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id: Number(lectureId) },
      include: {
        course: {
          include: {
            groups: {
              select: { groupId: true },
            },
          },
        },
      },
    });
    if (!lecture) {
      return res.status(404).json({ error: 'Лекция не найдена' });
    }

    // Проверка доступа для студента
    if (user.role === 'STUDENT') {
      const userWithGroup = await prisma.user.findUnique({
        where: { id: user.id },
        select: { groupId: true },
      });
      if (!userWithGroup?.groupId) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }
      const hasAccess = lecture.course.groups.some(g => g.groupId === userWithGroup.groupId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Доступ запрещён' });
      }
    }

    res.json(lecture);
  } catch (error) {
    console.error('Ошибка получения лекции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ===== Создать лекцию (только TEACHER/ADMIN) =====
export const createLecture = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title, description, order } = req.body;
  const user = (req as any).user;
  const file = req.file;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  if (!title) {
    return res.status(400).json({ error: 'Название обязательно' });
  }

  try {
    // Проверяем, что курс существует и пользователь имеет права
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
    });
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }
    if (user.role !== 'ADMIN' && course.teacherId !== user.id) {
      return res.status(403).json({ error: 'Вы не можете создавать лекции для этого курса' });
    }

    const lectureData: any = {
      title,
      description: description || null,
      order: order ? parseInt(order) : 0,
      courseId: Number(courseId),
    };

    // Если файл загружен, добавляем URL
    if (file) {
      lectureData.fileUrl = `/uploads/lectures/${file.filename}`;
    }

    const lecture = await prisma.lecture.create({
      data: lectureData,
    });
    res.status(201).json(lecture);
  } catch (error) {
    console.error('Ошибка создания лекции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ===== Обновить лекцию (только TEACHER/ADMIN) =====
export const updateLecture = async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const { title, description, order } = req.body;
  const user = (req as any).user;
  const file = req.file;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id: Number(lectureId) },
      include: { course: true },
    });
    if (!lecture) {
      return res.status(404).json({ error: 'Лекция не найдена' });
    }
    if (user.role !== 'ADMIN' && lecture.course.teacherId !== user.id) {
      return res.status(403).json({ error: 'Вы не можете редактировать эту лекцию' });
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = parseInt(order);
    if (file) {
      // Если есть старый файл, удаляем его
      if (lecture.fileUrl) {
        const oldFilePath = path.join(__dirname, '../..', lecture.fileUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      updateData.fileUrl = `/uploads/lectures/${file.filename}`;
    }

    const updated = await prisma.lecture.update({
      where: { id: Number(lectureId) },
      data: updateData,
    });
    res.json(updated);
  } catch (error) {
    console.error('Ошибка обновления лекции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ===== Удалить лекцию (только TEACHER/ADMIN) =====
export const deleteLecture = async (req: Request, res: Response) => {
  const { lectureId } = req.params;
  const user = (req as any).user;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id: Number(lectureId) },
      include: { course: true },
    });
    if (!lecture) {
      return res.status(404).json({ error: 'Лекция не найдена' });
    }
    if (user.role !== 'ADMIN' && lecture.course.teacherId !== user.id) {
      return res.status(403).json({ error: 'Вы не можете удалить эту лекцию' });
    }

    // Удаляем файл с диска, если он существует
    if (lecture.fileUrl) {
      const filePath = path.join(__dirname, '../..', lecture.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.lecture.delete({
      where: { id: Number(lectureId) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Ошибка удаления лекции:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ===== Загрузить файл для лекции (отдельный эндпоинт) =====
export const uploadLectureFileHandler = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }
  const fileUrl = `/uploads/lectures/${req.file.filename}`;
  res.json({ fileUrl });
};

// ===== Назначить группы на курс (только TEACHER/ADMIN) =====
export const assignGroupsToCourse = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { groupIds } = req.body;
  const user = (req as any).user;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
    return res.status(400).json({ error: 'Укажите хотя бы одну группу' });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: Number(courseId) },
    });
    if (!course) {
      return res.status(404).json({ error: 'Курс не найден' });
    }
    if (user.role !== 'ADMIN' && course.teacherId !== user.id) {
      return res.status(403).json({ error: 'Вы не можете назначать группы для этого курса' });
    }

    // Удаляем старые связи
    await prisma.courseGroup.deleteMany({
      where: { courseId: Number(courseId) },
    });

    // Создаём новые
    const assignments = groupIds.map((groupId: number) => ({
      courseId: Number(courseId),
      groupId,
    }));

    await prisma.courseGroup.createMany({
      data: assignments,
    });

    res.json({ message: 'Группы назначены' });
  } catch (error) {
    console.error('Ошибка назначения групп:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// ===== Получить группы, имеющие доступ к курсу =====
export const getCourseGroups = async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const user = (req as any).user;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  try {
    const courseGroups = await prisma.courseGroup.findMany({
      where: { courseId: Number(courseId) },
      include: {
        group: true,
      },
    });
    res.json(courseGroups);
  } catch (error) {
    console.error('Ошибка получения групп курса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};