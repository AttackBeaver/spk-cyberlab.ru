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
        // временный username, чтобы не нарушать уникальность
        username: `temp-${Date.now()}-${studentNumber}`,
      },
    });
    results.push({ studentNumber, status: 'created', id: newUser.id });
  }
  res.status(201).json(results);
};

// Создание преподавателя (только ADMIN)
export const createTeacher = async (req: Request, res: Response) => {
  const { username, email, fullName, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const teacher = await prisma.user.create({
      data: {
        username,
        email,
        fullName,
        passwordHash: hashedPassword,
        role: 'TEACHER',
      },
    });
    res.status(201).json({ id: teacher.id, username: teacher.username, role: teacher.role });
  } catch (error) {
    res.status(400).json({ error: 'Пользователь с таким логином или email уже существует' });
  }
};

// Сброс пароля (только ADMIN)
export const resetPassword = async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: Number(userId) },
    data: { passwordHash: hashed },
  });
  res.json({ message: 'Пароль сброшен' });
};