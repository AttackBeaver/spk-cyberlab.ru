import { PrismaClient } from '@prisma/client';
console.log('DATABASE_URL:', process.env.DATABASE_URL); // убедимся, что переменная загружена
const prisma = new PrismaClient();
export default prisma;