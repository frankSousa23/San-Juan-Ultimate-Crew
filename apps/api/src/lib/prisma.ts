import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.PRISMA_PROFILE === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
