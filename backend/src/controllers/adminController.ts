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
  const { username, fullName, password } = req.body; // email удалён
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
    where: { username }, // поиск только по логину
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
        select: { id: true, fullName: true, studentNumber: true, username: true }, // email удалён
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
      teacher: { select: { id: true, fullName: true } }, // email удалён
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(courses);
};

// Удаление пользователя (только ADMIN)
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = (req as any).user.id;

  if (Number(id) === currentUserId) {
    return res.status(403).json({ error: 'Нельзя удалить самого себя' });
  }

  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  await prisma.user.delete({ where: { id: Number(id) } });
  res.status(204).send();
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

// Редактирование пользователя (только ADMIN) – email удалён
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, fullName } = req.body; // email удалён

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