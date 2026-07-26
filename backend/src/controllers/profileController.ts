import { Request, Response } from 'express';
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
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      taskAttempts: {
        where: { status: 'PASSED' },
        select: { score: true },
      },
    },
  });

  const result = users
    .map((user) => {
      const totalScore = user.taskAttempts.reduce((sum, ta) => sum + (ta.score || 0), 0);
      const count = user.taskAttempts.length;
      const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
      return {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        tasksCompleted: count,
        averageScore: avgScore,
      };
    })
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted || b.averageScore - a.averageScore)
    .slice(0, 20);

  res.json(result);
};