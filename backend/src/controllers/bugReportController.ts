import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Получить все отчёты (для ADMIN)
export const getAllReports = async (req: Request, res: Response) => {
  const reports = await prisma.bugReport.findMany({
    include: {
      user: { select: { id: true, fullName: true } }, // email удалён
      responder: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reports);
};

// Получить отчёты текущего пользователя (для STUDENT/TEACHER)
export const getMyReports = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const reports = await prisma.bugReport.findMany({
    where: { userId },
    include: {
      responder: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reports);
};

// Получить один отчёт по ID (с проверкой прав)
export const getReportById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const report = await prisma.bugReport.findUnique({
    where: { id: Number(id) },
    include: {
      user: { select: { id: true, fullName: true } }, // email удалён
      responder: { select: { id: true, fullName: true } },
    },
  });
  if (!report) return res.status(404).json({ error: 'Отчёт не найден' });

  if (userRole !== 'ADMIN' && report.userId !== userId) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  res.json(report);
};

// Создать новый отчёт (авторизованный пользователь)
export const createReport = async (req: Request, res: Response) => {
  const { title, description, steps, severity, category } = req.body;
  const userId = (req as any).user.id;

  if (!title || !description) {
    return res.status(400).json({ error: 'Название и описание обязательны' });
  }

  const report = await prisma.bugReport.create({
    data: {
      title,
      description,
      steps,
      severity: severity || 'MEDIUM',
      category: category || 'OTHER',
      userId,
    },
  });
  res.status(201).json(report);
};

// Ответить на отчёт (только ADMIN)
export const respondToReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminResponse, status } = req.body;
  const adminId = (req as any).user.id;

  if (!adminResponse || !status) {
    return res.status(400).json({ error: 'Требуется ответ и статус' });
  }

  const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'WONTFIX', 'CLOSED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Некорректный статус' });
  }

  const report = await prisma.bugReport.update({
    where: { id: Number(id) },
    data: {
      adminResponse,
      status,
      respondedBy: adminId,
      respondedAt: new Date(),
    },
  });
  res.json(report);
};

// Удалить отчёт (только ADMIN)
export const deleteReport = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.bugReport.delete({ where: { id: Number(id) } });
  res.status(204).send();
};