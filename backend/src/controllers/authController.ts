import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { awardAchievement } from '../utils/achievementUtils';
import { logAction, LogActions } from '../utils/logger';

// Регистрация студента
export const registerStudent = async (req: Request, res: Response) => {
  const { groupId, studentNumber, password, fullName } = req.body;

  const group = await prisma.group.findUnique({
    where: { id: Number(groupId) },
  });
  if (!group) {
    return res.status(404).json({ error: 'Группа не найдена' });
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      groupId: Number(groupId),
      studentNumber: Number(studentNumber),
    },
  });

  if (!existingUser) {
    return res.status(404).json({ error: 'Студент с таким номером не найден в этой группе' });
  }

  if (existingUser.passwordHash) {
    return res.status(400).json({ error: 'Этот студент уже зарегистрирован' });
  }

  const username = `${group.prefix || group.name}-${String(studentNumber).padStart(2, '0')}`;
  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      passwordHash: hashedPassword,
      username: username,
      fullName: fullName || existingUser.fullName,
    },
  });

  await awardAchievement(updatedUser.id, 'Первый шаг');

  const token = jwt.sign(
    { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  // Аудит: успешная регистрация
  await logAction({
    action: LogActions.REGISTER,
    details: `Регистрация студента: ${updatedUser.username} (${updatedUser.fullName})`,
    userId: updatedUser.id,
    req,
  });

  res.status(201).json({
    token,
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
    },
  });
};

// Логин (только по username)
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { username: username },
  });

  // Пользователь не найден
  if (!user) {
    await logAction({
      action: LogActions.LOGIN_FAILED,
      details: `Неудачный вход: пользователь "${username}" не найден`,
      req,
    });
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  // Учётная запись не активирована
  if (!user.passwordHash) {
    await logAction({
      action: LogActions.LOGIN_FAILED,
      details: `Неудачный вход: учётная запись "${username}" не активирована`,
      userId: user.id,
      req,
    });
    return res.status(401).json({ error: 'Учётная запись не активирована' });
  }

  // Неверный пароль
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    await logAction({
      action: LogActions.LOGIN_FAILED,
      details: `Неудачный вход: неверный пароль для "${username}"`,
      userId: user.id,
      req,
    });
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  // Аудит: успешный вход
  await logAction({
    action: LogActions.LOGIN,
    details: `Успешный вход: ${user.username} (${user.fullName})`,
    userId: user.id,
    req,
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  });
};

// Получение профиля (защищённый)
export const getProfile = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      groupId: true,
      studentNumber: true,
      createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

// Получение списка групп (для выпадающего списка при регистрации)
export const getGroups = async (req: Request, res: Response) => {
  const groups = await prisma.group.findMany({
    select: { id: true, name: true, prefix: true },
    orderBy: { name: 'asc' },
  });
  res.json(groups);
};

// Выход из системы (для аудита; JWT остаётся валидным до истечения)
export const logout = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as number | undefined;

  if (userId) {
    // Подтянем username для читаемого лога
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, fullName: true },
    });

    await logAction({
      action: LogActions.LOGOUT,
      details: user
        ? `Выход: ${user.username} (${user.fullName})`
        : `Выход: userId=${userId}`,
      userId,
      req,
    });
  }

  res.json({ ok: true });
};