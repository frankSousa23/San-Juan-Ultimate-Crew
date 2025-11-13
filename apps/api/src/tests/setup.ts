import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

async function waitForDatabase(maxAttempts = 30, delayMs = 1000): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await checkDatabaseConnection()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  throw new Error('Database not available after maximum attempts')
}

beforeAll(async () => {
  await waitForDatabase()
  const shouldReset = process.env.CI === 'true' || process.env.RESET_DB === 'true'
  
  if (shouldReset) {
    try {
      execSync('npx prisma migrate reset --force --skip-seed', { 
        stdio: 'inherit',
        env: { ...process.env }
      })
    } catch (error) {
      console.warn('Failed to reset database, trying migrate deploy instead')
    }
  }
  
  try {
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env }
    })
  } catch (error) {
    console.warn('migrate deploy failed, trying db push instead')
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', { 
        stdio: 'inherit',
        env: { ...process.env }
      })
    } catch (pushError) {
      throw new Error('Failed to setup database schema')
    }
  }
  
  try {
    const userCount = await prisma.user.count()
    if (userCount === 0 || shouldReset) {
      execSync('npx tsx prisma/seed.ts', { 
        stdio: 'inherit',
        env: { ...process.env }
      })
    }
  } catch (error) {
    console.warn('Failed to seed database, continuing without seed data')
  }
})

afterAll(async () => {
  await prisma.$disconnect()
})

async function cleanupTestData() {
  await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 10000)
      }
    }
  })
  await prisma.roleRequest.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany({
    where: {
      email: {
        not: 'admin@example.com',
        contains: 'test'
      }
    }
  })
}

beforeEach(async () => {
  await cleanupTestData()
})

export async function createTestPlayer(name?: string, number?: number) {
  return await prisma.player.create({
    data: {
      name: name || `Test Player ${Date.now()}`,
      number: number || Math.floor(1000 + Math.random() * 9000),
      position: 'HANDLER',
      status: 'ACTIVE',
    },
  })
}

export async function createTestEvent(title?: string) {
  return await prisma.event.create({
    data: {
      title: title || `QA Event ${Date.now()}`,
      type: 'TRAINING',
      startsAt: new Date(),
    },
  })
}

export async function createTestUser(email?: string) {
  const testEmail = email || `test-${Date.now()}@example.com`
  return await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test User',
      passwordHash: 'hashed-password',
      playerId: null,
    },
  })
}

export { prisma }
