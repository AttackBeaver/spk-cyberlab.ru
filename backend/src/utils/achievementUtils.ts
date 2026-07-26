import prisma from '../utils/prisma';

// Выдача достижения пользователю (проверка на дубликат)
export const awardAchievement = async (userId: number, achievementName: string) => {
  // Находим достижение по имени
  const achievement = await prisma.achievement.findFirst({
    where: { name: achievementName },
  });
  if (!achievement) return false;

  // Проверяем, есть ли уже у пользователя
  const existing = await prisma.userAchievement.findFirst({
    where: {
      userId,
      achievementId: achievement.id,
    },
  });
  if (existing) return false;

  // Выдаём достижение
  await prisma.userAchievement.create({
    data: {
      userId,
      achievementId: achievement.id,
    },
  });
  return true;
};

// Проверка и выдача достижений на основе условий
export const checkAndAwardAchievements = async (userId: number) => {
  // 1. Выполнено 5 заданий по криптографии
  const cryptoTasks = await prisma.taskAttempt.count({
    where: {
      userId,
      status: 'PASSED',
      task: { type: 'CRYPTO_ANALYSIS' },
    },
  });
  if (cryptoTasks >= 5) {
    await awardAchievement(userId, 'Знаток криптографии');
  }

  // 2. Выполнено задание по SQL-инъекциям
  const sqlTasks = await prisma.taskAttempt.count({
    where: {
      userId,
      status: 'PASSED',
      task: { type: 'SQL_INJECTION' },
    },
  });
  if (sqlTasks >= 1) {
    await awardAchievement(userId, 'Мастер SQL');
  }

  // 3. Выполнено 10 заданий (любых)
  const totalTasks = await prisma.taskAttempt.count({
    where: { userId, status: 'PASSED' },
  });
  if (totalTasks >= 10) {
    await awardAchievement(userId, 'Хакер');
  }

  // 4. Средний балл > 90%
  const avg = await prisma.taskAttempt.aggregate({
    where: { userId, status: 'PASSED' },
    _avg: { score: true },
  });
  if (avg._avg.score && avg._avg.score >= 90) {
    await awardAchievement(userId, 'Эксперт');
  }

  // 5. Предложил 5 мемов (если есть модель Meme)
  const memesCount = await prisma.meme.count({
    where: { authorId: userId, approved: true },
  });
  if (memesCount >= 5) {
    await awardAchievement(userId, 'Мемолог');
  }
};