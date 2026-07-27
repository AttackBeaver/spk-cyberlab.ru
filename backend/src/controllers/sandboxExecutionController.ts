import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ===== Проверка доступа студента к заданию =====
const checkTaskAccess = async (taskId: number, userId: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { groupId: true },
  });
  if (!user?.groupId) return false;

  const taskGroup = await prisma.sandboxTaskGroup.findFirst({
    where: {
      taskId: taskId,
      groupId: user.groupId,
    },
  });
  return !!taskGroup;
};

// ===== Проверка лимитов (попытки, время) =====
const checkLimits = async (taskId: number, userId: number) => {
  const task = await prisma.sandboxTask.findUnique({
    where: { id: taskId },
    select: { attemptsLimit: true, timeLimit: true },
  });
  if (!task) throw new Error('Задание не найдено');

  // Проверка попыток
  if (task.attemptsLimit !== null) {
    const attemptsCount = await prisma.sandboxAttempt.count({
      where: {
        taskId,
        userId,
        status: { not: 'PENDING' },
      },
    });
    if (attemptsCount >= task.attemptsLimit) {
      throw new Error('Достигнут лимит попыток');
    }
  }

  // Проверка времени (если есть активная попытка)
  const activeAttempt = await prisma.sandboxAttempt.findFirst({
    where: {
      taskId,
      userId,
      status: 'PENDING',
    },
    orderBy: { startedAt: 'desc' },
  });
  if (activeAttempt && task.timeLimit) {
    const elapsed = (Date.now() - new Date(activeAttempt.startedAt).getTime()) / 60000;
    if (elapsed > task.timeLimit) {
      await prisma.sandboxAttempt.update({
        where: { id: activeAttempt.id },
        data: { status: 'TIME_EXPIRED', completedAt: new Date() },
      });
      throw new Error('Время истекло');
    }
    return { activeAttempt };
  }
  return { activeAttempt: null };
};

// ===== Логика проверки ответа =====
const checkAnswer = (task: any, answer: string): { score: number; feedback: string } => {
  // Для CUSTOM – проверка по шаблону
  if (task.type === 'CUSTOM' && task.answerTemplate) {
    const isCorrect = answer.trim().toLowerCase() === task.answerTemplate.trim().toLowerCase();
    return {
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? '✅ Правильно!' : '❌ Неправильный ответ. Попробуйте ещё раз.',
    };
  }

  // SQL_INJECTION – эмуляция
  if (task.type === 'SQL_INJECTION') {
    const dangerous = ['--', ';', "'", '"', 'DROP', 'DELETE', 'UPDATE', 'INSERT'];
    const hasDanger = dangerous.some(kw => answer.toUpperCase().includes(kw));
    if (hasDanger) {
      return {
        score: 100,
        feedback: '✅ Вы обнаружили уязвимость! SQL-инъекция успешно выполнена.',
      };
    } else {
      return {
        score: 0,
        feedback: '❌ В запросе нет признаков SQL-инъекции. Попробуйте использовать специальные символы.',
      };
    }
  }

  // XSS – поиск тегов
  if (task.type === 'XSS') {
    const xssPatterns = ['<script>', 'onerror=', 'alert(', 'javascript:'];
    const found = xssPatterns.some(p => answer.toLowerCase().includes(p));
    return {
      score: found ? 100 : 0,
      feedback: found ? '✅ XSS-атака обнаружена!' : '❌ В вводе нет признаков XSS.',
    };
  }

  // CODE, PHISHING и др. – заглушка
  return {
    score: 0,
    feedback: '⏳ Этот тип задания пока не поддерживается автоматической проверкой.',
  };
};

// ===== Основные функции =====

export const startAttempt = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = (req as any).user.id;

  const hasAccess = await checkTaskAccess(Number(taskId), userId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Вы не имеете доступа к этому заданию' });
  }

  try {
    const { activeAttempt } = await checkLimits(Number(taskId), userId);
    if (activeAttempt) {
      return res.json({
        message: 'Продолжите выполнение начатой попытки',
        attemptId: activeAttempt.id,
        startedAt: activeAttempt.startedAt,
        remainingTime: null, // можно рассчитать позже
      });
    }
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }

  const attempt = await prisma.sandboxAttempt.create({
    data: {
      taskId: Number(taskId),
      userId,
      status: 'PENDING',
      startedAt: new Date(),
    },
  });

  res.status(201).json({
    message: 'Попытка начата',
    attemptId: attempt.id,
    startedAt: attempt.startedAt,
  });
};

export const submitAttempt = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { answer } = req.body;
  const userId = (req as any).user.id;

  if (!answer) {
    return res.status(400).json({ error: 'Ответ не может быть пустым' });
  }

  const hasAccess = await checkTaskAccess(Number(taskId), userId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Вы не имеете доступа к этому заданию' });
  }

  const attempt = await prisma.sandboxAttempt.findFirst({
    where: {
      taskId: Number(taskId),
      userId,
      status: 'PENDING',
    },
    orderBy: { startedAt: 'desc' },
  });
  if (!attempt) {
    return res.status(404).json({ error: 'Нет активной попытки. Начните новую попытку.' });
  }

  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(taskId) },
    select: { type: true, answerTemplate: true, points: true },
  });
  if (!task) return res.status(404).json({ error: 'Задание не найдено' });

  const { score, feedback } = checkAnswer(task, answer);

  const updatedAttempt = await prisma.sandboxAttempt.update({
    where: { id: attempt.id },
    data: {
      answer,
      score,
      status: score === 100 ? 'PASSED' : 'FAILED',
      feedback,
      completedAt: new Date(),
    },
  });

  res.json({
    attempt: updatedAttempt,
    score,
    feedback,
    status: updatedAttempt.status,
  });
};

export const getMyAttempts = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const attempts = await prisma.sandboxAttempt.findMany({
    where: { userId },
    include: {
      task: {
        select: { id: true, title: true, type: true },
      },
    },
    orderBy: { startedAt: 'desc' },
  });
  res.json(attempts);
};

export const getAttemptDetails = async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const userId = (req as any).user.id;

  const attempt = await prisma.sandboxAttempt.findUnique({
    where: { id: Number(attemptId) },
    include: {
      task: {
        select: { id: true, title: true, description: true, type: true, points: true },
      },
    },
  });
  if (!attempt) return res.status(404).json({ error: 'Попытка не найдена' });

  const userRole = (req as any).user.role;
  if (attempt.userId !== userId && userRole !== 'TEACHER' && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  res.json(attempt);
};

// Вспомогательная функция (заглушка)
const calculateRemainingTime = (startedAt: Date, taskId: number): number | null => {
  return null;
};