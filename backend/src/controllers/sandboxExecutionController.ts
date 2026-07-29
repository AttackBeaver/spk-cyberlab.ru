import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { executeCode } from '../services/codeExecutor';

// Тип для задачи при проверке
interface TaskForCheck {
  type: string;
  answerTemplate: string | null;
  expectedResult: string | null;
  points: number;
  config: any | null; // для CODE – содержит язык
}

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

// ===== Логика проверки ответа (асинхронная) =====
const checkAnswer = async (task: TaskForCheck, answer: string): Promise<{ score: number; feedback: string }> => {
  // 1. Проверка ожидаемого результата (для интерактивных заданий)
  if (task.expectedResult) {
    const containsExpected = answer.toLowerCase().includes(task.expectedResult.toLowerCase());
    if (containsExpected) {
      return { score: 100, feedback: '✅ Ожидаемый результат обнаружен! Задание выполнено.' };
    } else {
      return { score: 0, feedback: '❌ Ожидаемый результат не найден. Попробуйте ещё раз.' };
    }
  }

  // 2. Для CUSTOM – проверка по шаблону
  if (task.type === 'CUSTOM' && task.answerTemplate) {
    const isCorrect = answer.trim().toLowerCase() === task.answerTemplate.trim().toLowerCase();
    return {
      score: isCorrect ? 100 : 0,
      feedback: isCorrect ? '✅ Правильно!' : '❌ Неправильный ответ. Попробуйте ещё раз.',
    };
  }

  // 3. SQL_INJECTION – расширенная проверка
  if (task.type === 'SQL_INJECTION') {
    const sqlPatterns = [
      /' OR '1'='1/, /" OR "1"="1/, /' OR 1=1/, /" OR 1=1/,
      /;.*DROP\s+TABLE/i, /;.*DELETE\s+FROM/i, /;.*UPDATE/i,
      /UNION\s+SELECT/i, /--/, /#/, /\/\*.*\*\//,
      /OR\s+1=1/, /OR\s+1=1--/,
      /';\s*DROP\s+TABLE/i, /'; DROP TABLE/i,
    ];
    const found = sqlPatterns.some(pattern => pattern.test(answer));
    if (found) {
      return { score: 100, feedback: '✅ SQL-инъекция обнаружена!' };
    } else {
      const hasQuote = answer.includes("'") || answer.includes('"');
      const hasSQLKeyword = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b/i.test(answer);
      if (hasQuote && hasSQLKeyword) {
        return { score: 50, feedback: '⚠️ Частичное совпадение: похоже на SQL-инъекцию, но недостаточно.' };
      }
      return { score: 0, feedback: '❌ В запросе нет признаков SQL-инъекции. Попробуйте использовать OR, UNION, комментарии или специальные символы.' };
    }
  }

  // 4. XSS – поиск тегов
  if (task.type === 'XSS') {
    const xssPatterns = ['<script>', 'onerror=', 'alert(', 'javascript:'];
    const found = xssPatterns.some(p => answer.toLowerCase().includes(p));
    return {
      score: found ? 100 : 0,
      feedback: found ? '✅ XSS-атака обнаружена!' : '❌ В вводе нет признаков XSS.',
    };
  }

  // 5. CODE – выполнение кода
  if (task.type === 'CODE') {
    // Определяем язык из конфига или по умолчанию Python
    const language = task.config?.language || 'python';
    const result = await executeCode(answer, language);

    if (result.success) {
      // Сравниваем вывод с ожидаемым результатом
      const expected = task.expectedResult || '';
      const isMatch = result.output.toLowerCase().includes(expected.toLowerCase());
      if (isMatch) {
        return { score: 100, feedback: '✅ Код выполнен успешно, вывод соответствует ожидаемому.' };
      } else {
        return {
          score: 0,
          feedback: `❌ Вывод программы не соответствует ожидаемому.\nОжидалось: ${expected}\nПолучено: ${result.output}`,
        };
      }
    } else {
      return { score: 0, feedback: `❌ Ошибка выполнения кода: ${result.error || result.output}` };
    }
  }

  // 6. PHISHING и другие – заглушка
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
        remainingTime: null,
      });
    }
  } catch (error) {
    const err = error as Error;
    return res.status(400).json({ error: err.message });
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

  // Добавляем config в select для поддержки CODE
  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(taskId) },
    select: {
      type: true,
      answerTemplate: true,
      points: true,
      expectedResult: true,
      config: true, // <-- добавлено
    },
  });
  if (!task) return res.status(404).json({ error: 'Задание не найдено' });

  // Приводим task к TaskForCheck (config может быть null или объектом)
  const taskForCheck: TaskForCheck = {
    type: task.type,
    answerTemplate: task.answerTemplate,
    expectedResult: task.expectedResult,
    points: task.points,
    config: task.config,
  };

  const { score, feedback } = await checkAnswer(taskForCheck, answer);

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

// ===== Выполнение кода без сохранения попытки (для предварительного запуска) =====
export const executeCodeHandler = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { code, language } = req.body;
  const userId = (req as any).user.id;

  if (!code) {
    return res.status(400).json({ error: 'Код не указан' });
  }

  // Проверка доступа
  const hasAccess = await checkTaskAccess(Number(taskId), userId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  const result = await executeCode(code, language || 'python');
  res.json(result);
};