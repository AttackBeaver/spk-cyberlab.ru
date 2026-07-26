import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';

export const getProfileStats = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const totalCourses = await prisma.course.count();
  const completedTasks = await prisma.taskAttempt.count({
    where: { userId, status: 'PASSED' },
  });
  const avgResult = await prisma.taskAttempt.aggregate({
    where: { userId, status: 'PASSED' },
    _avg: { score: true },
  });
  const averageScore = avgResult._avg.score || 0;

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { earnedAt: 'desc' },
  });

  const achievements = userAchievements.map((ua) => ({
    id: ua.achievement.id,
    name: ua.achievement.name,
    description: ua.achievement.description,
    icon: ua.achievement.icon,
    earnedAt: ua.earnedAt.toISOString(),
  }));

  res.json({
    totalCourses,
    completedTasks,
    averageScore: Math.round(averageScore),
    achievements,
  });
};

export const getLeaderboard = async (req: Request, res: Response) => {
  const leaderboard = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      taskAttempts: {
        where: { status: 'PASSED' },
        select: { score: true },
      },
      _count: {
        select: { taskAttempts: { where: { status: 'PASSED' } } },
      },
    },
    orderBy: {
      taskAttempts: {
        _count: 'desc',
      },
    },
    take: 20,
  });

  const result = leaderboard.map((user) => {
    const totalScore = user.taskAttempts.reduce((sum, ta) => sum + (ta.score || 0), 0);
    const avgScore = user.taskAttempts.length > 0 ? Math.round(totalScore / user.taskAttempts.length) : 0;
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      tasksCompleted: user._count.taskAttempts,
      averageScore: avgScore,
    };
  });

  res.json(result);
};

export const changePassword = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Не указаны старый или новый пароль' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Новый пароль должен содержать не менее 6 символов' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const isValid = await bcrypt.compare(oldPassword, user.passwordHash || '');
  if (!isValid) {
    return res.status(401).json({ error: 'Неверный старый пароль' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashed },
  });

  res.json({ message: 'Пароль успешно изменён' });
};

// Новая функция: история выполненных заданий
export const getTaskHistory = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const attempts = await prisma.taskAttempt.findMany({
    where: { userId },
    include: {
      task: {
        include: {
          topic: {
            include: {
              module: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
    take: 50,
  });

  const history = attempts.map((attempt) => ({
    id: attempt.id,
    taskTitle: attempt.task.title,
    courseTitle: attempt.task.topic.module.course.title,
    score: attempt.score,
    status: attempt.status,
    completedAt: attempt.completedAt,
  }));

  res.json(history);
};