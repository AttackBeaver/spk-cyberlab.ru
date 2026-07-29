import { Request, Response } from 'express';
import prisma from '../utils/prisma';

const isTeacherOrAdmin = (role: string) => role === 'TEACHER' || role === 'ADMIN';

// ===== CRUD для шаблонов =====

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!isTeacherOrAdmin(user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const templates = await prisma.sandboxTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (error) {
    console.error('Ошибка при получении шаблонов:', error);
    res.status(500).json({ error: 'Ошибка сервера при загрузке шаблонов' });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!isTeacherOrAdmin(user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const { id } = req.params;
    const template = await prisma.sandboxTemplate.findUnique({
      where: { id: Number(id) },
    });
    if (!template) return res.status(404).json({ error: 'Шаблон не найден' });
    res.json(template);
  } catch (error) {
    console.error('Ошибка при получении шаблона:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Только администратор может создавать шаблоны' });
    }

    const { name, description, type, configSchema, defaultConfig, previewHtml } = req.body;

    if (!name || !description || !type || !configSchema || !defaultConfig) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const template = await prisma.sandboxTemplate.create({
      data: {
        name,
        description,
        type,
        configSchema,
        defaultConfig,
        previewHtml: previewHtml || null,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Ошибка при создании шаблона:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании шаблона' });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Только администратор может редактировать шаблоны' });
    }

    const { id } = req.params;
    const { name, description, type, configSchema, defaultConfig, previewHtml } = req.body;

    const existing = await prisma.sandboxTemplate.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) return res.status(404).json({ error: 'Шаблон не найден' });

    const updated = await prisma.sandboxTemplate.update({
      where: { id: Number(id) },
      data: {
        name: name || existing.name,
        description: description || existing.description,
        type: type || existing.type,
        configSchema: configSchema || existing.configSchema,
        defaultConfig: defaultConfig || existing.defaultConfig,
        previewHtml: previewHtml !== undefined ? previewHtml : existing.previewHtml,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Ошибка при обновлении шаблона:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении шаблона' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Только администратор может удалять шаблоны' });
    }

    const { id } = req.params;
    const existing = await prisma.sandboxTemplate.findUnique({
      where: { id: Number(id) },
      include: { tasks: true },
    });
    if (!existing) return res.status(404).json({ error: 'Шаблон не найден' });

    if (existing.tasks.length > 0) {
      return res.status(400).json({
        error: 'Невозможно удалить шаблон, так как он используется в заданиях',
      });
    }

    await prisma.sandboxTemplate.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Ошибка при удалении шаблона:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении шаблона' });
  }
};

export const createTaskFromTemplate = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!isTeacherOrAdmin(user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const { templateId } = req.params;
    const { title, description, instructions, config, timeLimit, attemptsLimit, points } = req.body;

    const template = await prisma.sandboxTemplate.findUnique({
      where: { id: Number(templateId) },
    });
    if (!template) return res.status(404).json({ error: 'Шаблон не найден' });

    const task = await prisma.sandboxTask.create({
      data: {
        title: title || template.name,
        description: description || template.description,
        type: template.type,
        config: config || template.defaultConfig,
        htmlTemplate: template.previewHtml || null,
        templateId: Number(templateId),
        createdBy: user.id,
        timeLimit: timeLimit || null,
        attemptsLimit: attemptsLimit || null,
        points: points || 0,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Ошибка при создании задания из шаблона:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании задания из шаблона' });
  }
};