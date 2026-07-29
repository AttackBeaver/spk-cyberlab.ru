import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// ===== Проверка прав =====
const isTeacherOrAdmin = (role: string) => role === 'TEACHER' || role === 'ADMIN';

// ===== Проверка доступа студента к заданию =====
const checkTaskAccess = async (taskId: number, userId: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { groupId: true },
  });
  if (!user?.groupId) return false;

  const taskGroup = await prisma.sandboxTaskGroup.findFirst({
    where: {
      taskId,
      groupId: user.groupId,
    },
  });
  return !!taskGroup;
};

// ===== 1. Студент отправляет отчёт на проверку =====
export const submitReport = async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const { text } = req.body;
  const userId = (req as any).user.id;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Текст отчёта не может быть пустым' });
  }

  // Проверяем, что попытка существует и принадлежит пользователю
  const attempt = await prisma.sandboxAttempt.findUnique({
    where: { id: Number(attemptId) },
    include: {
      task: {
        select: { isManualReview: true },
      },
    },
  });

  if (!attempt) {
    return res.status(404).json({ error: 'Попытка не найдена' });
  }

  if (attempt.userId !== userId) {
    return res.status(403).json({ error: 'Вы не можете отправить отчёт для чужой попытки' });
  }

  // Проверяем, что задание требует ручной проверки
  if (!attempt.task.isManualReview) {
    return res.status(400).json({ error: 'Это задание не требует ручной проверки' });
  }

  // Проверяем, не отправлен ли уже отчёт
  const existingReport = await prisma.sandboxStudentReport.findUnique({
    where: { attemptId: Number(attemptId) },
  });

  if (existingReport) {
    return res.status(400).json({ error: 'Отчёт для этой попытки уже отправлен' });
  }

  // Создаём отчёт
  const report = await prisma.sandboxStudentReport.create({
    data: {
      attemptId: Number(attemptId),
      text: text.trim(),
    },
  });

  // Обновляем статус попытки на "PENDING" (если он ещё не изменён)
  await prisma.sandboxAttempt.update({
    where: { id: Number(attemptId) },
    data: { status: 'PENDING' }, // Отчёт на проверке
  });

  res.status(201).json(report);
};

// ===== 2. Преподаватель получает все отчёты по заданию =====
export const getReportsByTask = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const user = (req as any).user;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(taskId) },
    select: { createdBy: true },
  });

  if (!task) {
    return res.status(404).json({ error: 'Задание не найдено' });
  }

  // Проверяем, что преподаватель является создателем задания или администратором
  if (user.role !== 'ADMIN' && task.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете просматривать отчёты для этого задания' });
  }

  const reports = await prisma.sandboxStudentReport.findMany({
    where: {
      attempt: {
        taskId: Number(taskId),
      },
    },
    include: {
      attempt: {
        include: {
          user: {
            select: { id: true, fullName: true, username: true, group: true },
          },
          task: {
            select: { id: true, title: true },
          },
        },
      },
      reviewer: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(reports);
};

// ===== 3. Преподаватель получает отчёт по ID =====
export const getReportById = async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const user = (req as any).user;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const report = await prisma.sandboxStudentReport.findUnique({
    where: { id: Number(reportId) },
    include: {
      attempt: {
        include: {
          user: {
            select: { id: true, fullName: true, username: true, group: true },
          },
          task: true,
        },
      },
      reviewer: {
        select: { id: true, fullName: true },
      },
    },
  });

  if (!report) {
    return res.status(404).json({ error: 'Отчёт не найден' });
  }

  // Проверяем, что преподаватель является создателем задания или администратором
  if (user.role !== 'ADMIN' && report.attempt.task.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете просматривать этот отчёт' });
  }

  res.json(report);
};

// ===== 4. Преподаватель выставляет оценку за отчёт =====
export const gradeReport = async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const { score, feedback } = req.body;
  const user = (req as any).user;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  if (score === undefined || score === null || isNaN(score) || score < 0 || score > 100) {
    return res.status(400).json({ error: 'Оценка должна быть числом от 0 до 100' });
  }

  const report = await prisma.sandboxStudentReport.findUnique({
    where: { id: Number(reportId) },
    include: {
      attempt: {
        include: {
          task: true,
        },
      },
    },
  });

  if (!report) {
    return res.status(404).json({ error: 'Отчёт не найден' });
  }

  // Проверяем, что преподаватель является создателем задания или администратором
  if (user.role !== 'ADMIN' && report.attempt.task.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете оценивать этот отчёт' });
  }

  // Обновляем отчёт
  const updatedReport = await prisma.sandboxStudentReport.update({
    where: { id: Number(reportId) },
    data: {
      score,
      reviewedBy: user.id,
      reviewedAt: new Date(),
    },
  });

  // Обновляем попытку: устанавливаем статус PASSED или FAILED в зависимости от оценки
  const attemptStatus = score >= 70 ? 'PASSED' : 'FAILED';
  await prisma.sandboxAttempt.update({
    where: { id: report.attemptId },
    data: {
      score,
      status: attemptStatus,
      feedback: feedback || null,
      completedAt: new Date(),
    },
  });

  res.json(updatedReport);
};

// ===== 5. Студент получает свои отчёты =====
export const getMyReports = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const reports = await prisma.sandboxStudentReport.findMany({
    where: {
      attempt: {
        userId,
      },
    },
    include: {
      attempt: {
        include: {
          task: {
            select: { id: true, title: true, description: true },
          },
        },
      },
      reviewer: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(reports);
};

// ===== 6. Получить статистику по заданию для преподавателя =====
export const getTaskStatistics = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const user = (req as any).user;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(taskId) },
    select: { createdBy: true, title: true },
  });

  if (!task) {
    return res.status(404).json({ error: 'Задание не найдено' });
  }

  if (user.role !== 'ADMIN' && task.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете просматривать статистику для этого задания' });
  }

  // Общая статистика по попыткам
  const attempts = await prisma.sandboxAttempt.findMany({
    where: { taskId: Number(taskId) },
    include: {
      user: {
        select: { id: true, fullName: true, username: true, group: true },
      },
      report: true,
    },
  });

  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(a => a.status === 'PASSED').length;
  const failedAttempts = attempts.filter(a => a.status === 'FAILED').length;
  const pendingAttempts = attempts.filter(a => a.status === 'PENDING').length;
  const timeExpiredAttempts = attempts.filter(a => a.status === 'TIME_EXPIRED').length;

  const scores = attempts.map(a => a.score).filter(s => s !== null) as number[];
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  // Данные по отчётам
  const reports = await prisma.sandboxStudentReport.findMany({
    where: {
      attempt: {
        taskId: Number(taskId),
      },
    },
    include: {
      attempt: {
        include: {
          user: {
            select: { fullName: true, username: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const reviewedReports = reports.filter(r => r.score !== null).length;
  const pendingReports = reports.filter(r => r.score === null).length;

  res.json({
    task: {
      id: Number(taskId),
      title: task.title,
    },
    attempts: {
      total: totalAttempts,
      passed: passedAttempts,
      failed: failedAttempts,
      pending: pendingAttempts,
      timeExpired: timeExpiredAttempts,
    },
    scores: {
      average: Math.round(averageScore * 100) / 100,
      max: scores.length > 0 ? Math.max(...scores) : 0,
      min: scores.length > 0 ? Math.min(...scores) : 0,
    },
    reports: {
      total: reports.length,
      reviewed: reviewedReports,
      pending: pendingReports,
    },
    students: attempts.map(a => ({
      id: a.user.id,
      fullName: a.user.fullName,
      username: a.user.username,
      group: a.user.group ? a.user.group.name : null,
      status: a.status,
      score: a.score,
      hasReport: !!a.report,
      reportReviewed: a.report?.score !== null,
    })),
  });
};

// ===== 7. Экспорт результатов в CSV =====
export const exportTaskResultsCSV = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const user = (req as any).user;

  if (!isTeacherOrAdmin(user.role)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  const task = await prisma.sandboxTask.findUnique({
    where: { id: Number(taskId) },
    select: { createdBy: true, title: true },
  });
  if (!task) {
    return res.status(404).json({ error: 'Задание не найдено' });
  }
  if (user.role !== 'ADMIN' && task.createdBy !== user.id) {
    return res.status(403).json({ error: 'Вы не можете экспортировать результаты для этого задания' });
  }

  // Получаем все попытки с пользователями и отчётами
  const attempts = await prisma.sandboxAttempt.findMany({
    where: { taskId: Number(taskId) },
    include: {
      user: {
        select: { fullName: true, username: true, group: { select: { name: true } } },
      },
      report: true,
    },
    orderBy: { completedAt: 'asc' },
  });

  // Формируем CSV
  const header = 'Студент,Логин,Группа,Статус,Балл,Отчёт,Оценка за отчёт\n';
  const rows = attempts.map(a => {
    const statusMap: Record<string, string> = {
      PENDING: 'Ожидает',
      PASSED: 'Выполнено',
      FAILED: 'Неверно',
      TIME_EXPIRED: 'Время истекло',
    };
    const status = statusMap[a.status] || a.status;
    const score = a.score !== null ? a.score : '';
    const reportText = a.report ? 'Да' : 'Нет';
    const reportScore = a.report?.score !== null && a.report?.score !== undefined ? a.report.score : '';
    const groupName = a.user.group?.name || '';
    return `${a.user.fullName},${a.user.username},${groupName},${status},${score},${reportText},${reportScore}`;
  }).join('\n');

  const csv = header + rows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=results_task_${taskId}.csv`);
  res.send(csv);
};