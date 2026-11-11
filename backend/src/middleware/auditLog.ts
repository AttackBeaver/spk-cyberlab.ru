import { Request, Response, NextFunction } from 'express';
import { logAction, LogActions } from '../utils/logger';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Пути, где логирование выполняется явно в контроллере —
// дублировать не нужно
const EXCLUDED_PREFIXES = ['/api/auth/'];

/**
 * Глобальный middleware аудита.
 *
 * Логирует все мутации (POST/PUT/PATCH/DELETE), кроме /api/auth/*,
 * после отправки ответа. Пишет action=HTTP_MUTATION (или HTTP_MUTATION_FAILED),
 * details="METHOD /path → status (duration)".
 *
 * Никогда не бросает исключений — ошибка логирования не должна
 * ломать основной запрос.
 */
export const auditLog = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    // 1. Не мутация — пропускаем
    if (!MUTATION_METHODS.has(req.method)) {
      return next();
    }

    // 2. Исключённые пути (/api/auth/*)
    const pathOnly = req.originalUrl.split('?')[0] ?? '';
    if (EXCLUDED_PREFIXES.some((prefix) => pathOnly.startsWith(prefix))) {
      return next();
    }

    // 3. Запоминаем время старта
    const startTime = Date.now();

    // 4. Логируем после отправки ответа
    res.on('finish', () => {
      try {
        const status = res.statusCode;
        const duration = Date.now() - startTime;
        const url = req.originalUrl.split('?')[0] ?? '';

        const action =
          status < 400 ? LogActions.HTTP_MUTATION : 'HTTP_MUTATION_FAILED';
        const details = `${req.method} ${url} → ${status} (${duration}ms)`;

        // Fire-and-forget: logAction сам ловит ошибки
        void logAction({ action, details, req });
      } catch (err) {
        console.error('[auditLog] finish handler error:', err);
      }
    });

    next();
  } catch (err) {
    // Middleware никогда не должен ломать запрос
    console.error('[auditLog] middleware error:', err);
    next();
  }
};