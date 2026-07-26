import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getProfileStats = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  // Количество курсов, на которые записан студент (пока просто все курсы)
  // В будущем можно добавить связь "UserCourse"
  const totalCourses = await prisma.course.count();

  // Выполненные задания (попытки со статусом PASSED)
  const completedTasks = await prisma.taskAttempt.count({
    where: { userId, status: 'PASSED' },
  });

  // Средний балл по выполненным заданиям
  const avgResult = await prisma.taskAttempt.aggregate({
    where: { userId, status: 'PASSED' },
    _avg: { score: true },
  });
  const averageScore = avgResult._avg.score || 0;

  // Достижения пользователя
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