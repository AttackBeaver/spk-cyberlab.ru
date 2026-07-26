import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createAttempt = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { answer, userId } = req.body;

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
    if (task.solutionTemplate) {
      // Приводим к нижнему регистру для регистронезависимого сравнения
      const isMatch = answer.toLowerCase().trim() === task.solutionTemplate.toLowerCase().trim();
      if (isMatch) {
        score = 100;
        message = '✅ Правильно! Отлично!';
      } else {
        score = 0;
        message = '❌ Неправильно. Попробуйте ещё раз.';
      }
    } else {
      // Если нет шаблона, просто сохраняем ответ (для ручной проверки)
      message = 'Ответ сохранён. Ожидайте проверки преподавателем.';
      score = 0; // или null
    }

    // Сохраняем попытку в БД
    const attempt = await prisma.taskAttempt.create({
      data: {
        userId: Number(userId),
        taskId: Number(taskId),
        answer,
        score: score > 0 ? score : null,
        status: score > 0 ? 'PASSED' : 'FAILED',
        completedAt: new Date(),
      },
    });

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