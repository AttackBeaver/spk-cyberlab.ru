import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
  { name: 'Первый шаг', description: 'Зарегистрировался на платформе', icon: '🎯', criteria: 'registration' },
  { name: 'Знаток криптографии', description: 'Выполнил 5 заданий по криптографии', icon: '🔐', criteria: 'crypto_5' },
  { name: 'Мастер SQL', description: 'Выполнил задание по SQL-инъекциям', icon: '🗄️', criteria: 'sql_first' },
  { name: 'Хакер', description: 'Выполнил 10 заданий', icon: '💻', criteria: 'tasks_10' },
  { name: 'Мемолог', description: 'Предложил 5 мемов', icon: '😂', criteria: 'memes_5' },
  { name: 'Эксперт', description: 'Средний балл > 90%', icon: '⭐', criteria: 'avg_score_90' },
];

async function main() {
  for (const ach of achievements) {
    const existing = await prisma.achievement.findFirst({
      where: { name: ach.name },
    });
    if (!existing) {
      await prisma.achievement.create({ data: ach });
      console.log(`✅ Создано достижение: ${ach.name}`);
    } else {
      console.log(`⚠️ Достижение уже существует: ${ach.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());