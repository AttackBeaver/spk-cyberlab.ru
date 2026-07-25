import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@spk-cyberlab.ru',
      passwordHash: hashedPassword,
      fullName: 'Administrator',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created: username=admin, password=admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());