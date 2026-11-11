import { Request } from 'express';
import prisma from './prisma';

/**
 * Централизованный список типов действий для аудита.
 * Используем строковые константы, чтобы избежать опечаток в контроллерах.
 * В БД `Log.action` — обычная строка (String), менять схему не нужно.
 */
export const LogActions = {
  // ---- Аутентификация ----
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // ---- Пользователи и группы (админ) ----
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  TEACHER_CREATE: 'TEACHER_CREATE',
  STUDENT_CREATE: 'STUDENT_CREATE',
  GROUP_CREATE: 'GROUP_CREATE',
  GROUP_DELETE: 'GROUP_DELETE',

  // ---- Курсы и лекции ----
  COURSE_CREATE: 'COURSE_CREATE',
  COURSE_UPDATE: 'COURSE_UPDATE',
  COURSE_DELETE: 'COURSE_DELETE',
  LECTURE_CREATE: 'LECTURE_CREATE',
  LECTURE_UPDATE: 'LECTURE_UPDATE',
  LECTURE_DELETE: 'LECTURE_DELETE',

  // ---- Задания (старые, курсовые) ----
  TASK_CREATE: 'TASK_CREATE',
  TASK_UPDATE: 'TASK_UPDATE',
  TASK_DELETE: 'TASK_DELETE',
  TASK_ATTEMPT: 'TASK_ATTEMPT',

  // ---- Мемы ----
  MEME_CREATE: 'MEME_CREATE',
  MEME_APPROVE: 'MEME_APPROVE',
  MEME_DELETE: 'MEME_DELETE',
  MEME_LIKE: 'MEME_LIKE',
  MEME_DISLIKE: 'MEME_DISLIKE',

  // ---- Новости ----
  NEWS_CREATE: 'NEWS_CREATE',
  NEWS_UPDATE: 'NEWS_UPDATE',
  NEWS_DELETE: 'NEWS_DELETE',

  // ---- Bug Bounty ----
  BUG_CREATE: 'BUG_CREATE',
  BUG_RESPOND: 'BUG_RESPOND',
  BUG_DELETE: 'BUG_DELETE',

  // ---- Полигон (sandbox) ----
  SANDBOX_TASK_CREATE: 'SANDBOX_TASK_CREATE',
  SANDBOX_TASK_UPDATE: 'SANDBOX_TASK_UPDATE',
  SANDBOX_TASK_DELETE: 'SANDBOX_TASK_DELETE',
  SANDBOX_ATTEMPT_START: 'SANDBOX_ATTEMPT_START',
  SANDBOX_ATTEMPT_SUBMIT: 'SANDBOX_ATTEMPT_SUBMIT',
  SANDBOX_REPORT_REVIEW: 'SANDBOX_REPORT_REVIEW',

  // ---- Универсальное (пишется middleware'ом) ----
  HTTP_MUTATION: 'HTTP_MUTATION',
} as const;

export type LogActionType = typeof LogActions[keyof typeof LogActions];

interface LogOptions {
  /** ID пользователя. Если не передан — попытается взять из req.user.id */
  userId?: number | null;
  /** Тип действия (обычно из LogActions) */
  action: LogActionType | string;
  /** Человекочитаемые детали: 'Курс "SQL", id=42' */
  details?: string;
  /** Express-запрос — чтобы вытащить IP и (опционально) userId */
  req?: Request;
}

/**
 * Записывает действие в таблицу Log.
 *
 * ВАЖНО: функция НИКОГДА не бросает исключений —
 * ошибка логирования не должна ронять основной запрос.
 * При ошибке пишет в console.error и выходит.
 */
export async function logAction(opts: LogOptions): Promise<void> {
  try {
    const { action, req } = opts;

    let finalUserId: number | null = opts.userId ?? null;
    let ip: string | null = null;

    if (req) {
      const reqAny = req as unknown as { user?: { id?: number } };
      // Если userId не передан явно — берём из req.user
      if (finalUserId === null && reqAny.user?.id) {
        finalUserId = reqAny.user.id;
      }

      // IP: приоритет X-Real-IP (ставит Nginx), затем X-Forwarded-For, затем req.ip
      const xRealIp = req.headers['x-real-ip'];
      const xForwardedFor = req.headers['x-forwarded-for'];

      if (typeof xRealIp === 'string' && xRealIp.trim()) {
        ip = xRealIp.split(',')[0]?.trim() ?? null;
      } else if (typeof xForwardedFor === 'string' && xForwardedFor.trim()) {
        ip = xForwardedFor.split(',')[0]?.trim() ?? null;
      } else {
        ip = req.ip || null;
      }
    }

    // Обрезаем details до 1000 символов — чтобы не раздувать БД
    const safeDetails = opts.details ? opts.details.slice(0, 1000) : null;

    await prisma.log.create({
      data: {
        userId: finalUserId,
        action,
        details: safeDetails,
        ip,
      },
    });
  } catch (err) {
    // Никогда не пробрасываем ошибку наружу
    console.error('[logAction] Failed to write audit log:', err);
  }
}