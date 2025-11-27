import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

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
    execSync('npx prisma db push --skip-generate --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env }
    })
  } catch (error) {
    console.warn('db push failed, trying migrate deploy instead')
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { ...process.env }
      })
    } catch (deployError) {
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
  // Delete audit logs first, as they might reference other entities
  // Check if AuditLog table exists before attempting to delete
  try {
    await prisma.$queryRaw`SELECT 1 FROM "public"."AuditLog" LIMIT 1;`
    await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 10000)
        }
      }
    })
  } catch (e: any) {
    if (e.code === 'P2021') {
      // Table does not exist, skip audit log cleanup
      console.warn('AuditLog table does not exist, skipping audit log cleanup.')
    } else {
      throw e
    }
  }
  await prisma.roleRequest.deleteMany()
  
  // Get seed users to preserve their roles
  const seedUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@example.com', 'guest@example.com', 'player@example.com']
      }
    },
    select: { id: true }
  })
  const seedUserIds = seedUsers.map(u => u.id)
  
  // Only delete UserRoles for non-seed users
  if (seedUserIds.length > 0) {
    await prisma.userRole.deleteMany({
      where: {
        userId: {
          notIn: seedUserIds
        }
      }
    })
  } else {
    // If seed users don't exist, delete all (they'll be recreated by seed)
    await prisma.userRole.deleteMany()
  }
  
  await prisma.user.deleteMany({
    where: {
      email: {
        not: 'admin@example.com',
        contains: 'test'
      }
    }
  })
  
  // Ensure seed users have their roles (re-seed if needed)
  // Use upsert to avoid unique constraint errors
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })
  if (adminUser) {
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } })
    if (adminRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
        update: {},
        create: { userId: adminUser.id, roleId: adminRole.id }
      })
    }
  }
  
  const guestUser = await prisma.user.findUnique({ where: { email: 'guest@example.com' } })
  if (guestUser) {
    const guestRole = await prisma.role.findUnique({ where: { name: 'guest' } })
    const playerRole = await prisma.role.findUnique({ where: { name: 'player' } })
    if (guestRole) {
      // Remove any player role from guest user first
      if (playerRole) {
        await prisma.userRole.deleteMany({
          where: {
            userId: guestUser.id,
            roleId: playerRole.id
          }
        }).catch(() => {})
      }
      // Ensure guest only has guest role
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: guestUser.id, roleId: guestRole.id } },
        update: {},
        create: { userId: guestUser.id, roleId: guestRole.id }
      })
    }
  }
  
  const playerUser = await prisma.user.findUnique({ where: { email: 'player@example.com' } })
  if (playerUser) {
    const playerRole = await prisma.role.findUnique({ where: { name: 'player' } })
    if (playerRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: playerUser.id, roleId: playerRole.id } },
        update: {},
        create: { userId: playerUser.id, roleId: playerRole.id }
      })
    }
  }
}

async function cleanupTestFiles() {
  const uploadsDir = path.resolve(process.cwd(), 'apps', 'api', 'uploads')
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir)
      const now = Date.now()
      for (const file of files) {
        const filePath = path.join(uploadsDir, file)
        try {
          const stats = fs.statSync(filePath)
          const isOld = (now - stats.mtimeMs) > 3600000
          if (file.startsWith('tmp-test-') || (file.endsWith('.txt') && file.includes('tmp-test') && isOld)) {
            fs.unlinkSync(filePath)
          }
        } catch (e) {
          // Ignore errors deleting files
        }
      }
    } catch (e) {
      // Ignore errors if directory doesn't exist or can't be read
    }
  }
  const duplicateDir = path.resolve(process.cwd(), 'apps', 'api', 'apps')
  if (fs.existsSync(duplicateDir)) {
    try {
      fs.rmSync(duplicateDir, { recursive: true, force: true })
    } catch (e) {
      // Ignore errors removing duplicate directory
    }
  }
}

beforeEach(async () => {
  await cleanupTestData()
  await cleanupTestFiles()
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
