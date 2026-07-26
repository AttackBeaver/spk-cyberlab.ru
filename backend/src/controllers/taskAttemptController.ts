import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { checkAndAwardAchievements } from '../utils/achievementUtils';

export const createAttempt = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { answer } = req.body;
  const userId = (req as any).user.id;

  try {
    // Получаем задание с шаблоном решения
    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      select: { solutionTemplate: true, difficulty: true, id: true },
    });
    if (!task) {
      return res.status(404).json({ error: 'Задание не найдено' });
    }

    // Простая проверка: сравниваем с шаблоном (для TEXT)
    let score = 0;
    let message = 'Ответ неверный';
    let status = 'FAILED';

    if (task.solutionTemplate) {
      const isMatch = answer.toLowerCase().trim() === task.solutionTemplate.toLowerCase().trim();
      if (isMatch) {
        score = 100;
        message = '✅ Правильно! Отлично!';
        status = 'PASSED';
      } else {
        score = 0;
        message = '❌ Неправильно. Попробуйте ещё раз.';
        status = 'FAILED';
      }
    } else {
      // Если нет шаблона, просто сохраняем ответ (для ручной проверки)
      message = 'Ответ сохранён. Ожидайте проверки преподавателем.';
      score = 0;
      status = 'PENDING';
    }

    // Сохраняем попытку в БД
    const attempt = await prisma.taskAttempt.create({
      data: {
        userId: Number(userId),
        taskId: Number(taskId),
        answer,
        score: score > 0 ? score : null,
        status: status as any,
        completedAt: new Date(),
      },
    });

    // Если задание выполнено успешно, проверяем достижения
    if (status === 'PASSED') {
      await checkAndAwardAchievements(Number(userId));
    }

    res.json({
      attemptId: attempt.id,
      score: score > 0 ? score : undefined,
      message,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при проверке задания' });
  }
};