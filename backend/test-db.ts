import { Pool } from 'pg';

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'prisma_user',
  password: 'prisma123',
  database: 'spk_cyberlab',
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Подключение через pg успешно:', res.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка подключения через pg:', err);
  } finally {
    await pool.end();
  }
})();