import { createRequire } from 'module';
import 'dotenv/config';
import { mockPrisma } from './mockDb.js';

const require = createRequire(import.meta.url);

let realPrisma: any = null;
let dbOffline = false;

// If DATABASE_URL is not set or points to standard local placeholders, immediately use mock layer
if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1')
) {
  dbOffline = true;
} else {
  try {
    const { PrismaClient } = require('@prisma/client');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 1500,
    });
    const adapter = new PrismaPg(pool);
    realPrisma = new PrismaClient({
      adapter,
      log: process.env.PRISMA_PROFILE === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  } catch (err) {
    dbOffline = true;
  }
}

export const prisma: any = new Proxy(mockPrisma, {
  get(target, modelName: string) {
    if (modelName.startsWith('$')) {
      return target[modelName] || (async () => {});
    }

    const mockModel = mockPrisma[modelName];
    if (dbOffline || !realPrisma) {
      return mockModel;
    }

    const realModel = realPrisma[modelName];
    if (!realModel) return mockModel;

    return new Proxy(mockModel || {}, {
      get(mTarget, actionName: string) {
        return async (...args: any[]) => {
          if (!dbOffline && realModel && typeof realModel[actionName] === 'function') {
            try {
              return await realModel[actionName](...args);
            } catch (err: any) {
              dbOffline = true;
              if (typeof mockModel?.[actionName] === 'function') {
                return await mockModel[actionName](...args);
              }
              throw err;
            }
          }
          if (typeof mockModel?.[actionName] === 'function') {
            return await mockModel[actionName](...args);
          }
          return null;
        };
      },
    });
  },
});
