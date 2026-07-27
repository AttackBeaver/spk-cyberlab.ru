import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { initDatabase, executeQuery, closeDatabase } from '../services/sqlExecutor';

// ===== Инициализация БД для задания =====
export const initSqlTask = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = (req as any).user.id;

  // Проверяем доступ к заданию
  const hasAccess = await checkTaskAccess(Number(taskId), userId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  // Получаем задание с конфигом
  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(taskId) },
    select: { config: true },
  });
  if (!task || !task.config) {
    return res.status(404).json({ error: 'Задание не найдено или не содержит конфигурации БД' });
  }

  // Парсим конфиг (ожидаем { schema: string, data: Record<string, any[]> })
  const config = task.config as any;
  if (!config.schema) {
    return res.status(400).json({ error: 'В конфиге отсутствует схема' });
  }

  try {
    // Инициализируем БД
    const db = initDatabase(config.schema, config.data || {});
    // Сохраняем сессию? Пока просто инициализируем – запросы будут выполняться к ней
    res.json({ message: 'База данных инициализирована' });
  } catch (error: any) {
    res.status(500).json({ error: `Ошибка инициализации БД: ${error.message}` });
  }
};

// ===== Выполнение SQL-запроса =====
export const executeSqlQuery = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { query } = req.body;
  const userId = (req as any).user.id;

  if (!query) {
    return res.status(400).json({ error: 'SQL-запрос не указан' });
  }

  // Проверяем доступ
  const hasAccess = await checkTaskAccess(Number(taskId), userId);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  // Выполняем запрос
  const result = executeQuery(query);
  res.json(result);
};

// ===== Закрыть БД (при завершении сессии) =====
export const closeSqlTask = async (req: Request, res: Response) => {
  closeDatabase();
  res.json({ message: 'База данных закрыта' });
};

// ===== Вспомогательная функция проверки доступа (скопирована из sandboxExecutionController) =====
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