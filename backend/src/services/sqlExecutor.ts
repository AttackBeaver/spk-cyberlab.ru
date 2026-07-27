import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';

// In-memory SQLite база данных
let db: Database.Database | null = null;

// Создать или пересоздать БД с заданной схемой и данными
export const initDatabase = (schema: string, data?: Record<string, any[]>): Database.Database => {
  if (db) {
    db.close();
  }
  db = new Database(':memory:');
  db.exec(schema);

  // Если есть данные для вставки
  if (data) {
    for (const [table, rows] of Object.entries(data)) {
      if (rows.length === 0) continue;
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const insertStmt = db.prepare(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
      );
      for (const row of rows) {
        insertStmt.run(...Object.values(row));
      }
    }
  }

  return db;
};

// Выполнить SQL-запрос и вернуть результат в формате JSON
export const executeQuery = (sql: string): { success: boolean; rows?: any[]; error?: string } => {
  if (!db) {
    return { success: false, error: 'База данных не инициализирована' };
  }

  // Разрешаем только SELECT-запросы для безопасности (можно расширить позже)
  const trimmed = sql.trim().toUpperCase();
  if (!trimmed.startsWith('SELECT')) {
    return { success: false, error: 'Разрешены только SELECT-запросы' };
  }

  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all();
    return { success: true, rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Получить текущий экземпляр БД (для использования в других модулях)
export const getDatabase = (): Database.Database | null => db;

// Закрыть БД
export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};