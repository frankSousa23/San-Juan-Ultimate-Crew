import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import process from 'node:process'
import fs from 'fs'
import path from 'path'

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter })

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
        stdio: 'ignore',
        env: { ...process.env },
        timeout: 30000
      })
    } catch (error) {
      // Ignore reset errors, continue with db push
    }
  }
  
  try {
    execSync('npx prisma db push  --accept-data-loss', { 
      stdio: 'ignore',
      env: { ...process.env },
      timeout: 20000
    })
  } catch (error) {
    // Schema already up to date or minor issue, continue
  }
  
  try {
    const userCount = await prisma.user.count()
    if (userCount === 0 || shouldReset) {
      execSync('npx tsx prisma/seed.ts', { 
        stdio: 'ignore',
        env: { ...process.env },
        timeout: 30000
      })
    }
  } catch (error) {
    // Seed may fail if data exists, continue
  }

  await ensureRolesAndPermissions()
}, 60000)

async function ensureRolesAndPermissions() {
  const managePerms = ['finance:manage', 'resources:manage', 'roster:manage', 'events:manage', 'communications:manage', 'injuries:manage', 'rivals:manage', 'plays:manage', 'annotations:manage', 'attendance:manage']
  const viewPerms = ['roster:view', 'events:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'finance:view', 'statistics:view', 'annotations:view', 'attendance:view']
  const allPermNames = [...managePerms, ...viewPerms]
  
  for (const name of allPermNames) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  const roleNames = ['admin', 'guest', 'player', 'captain', 'coach', 'treasurer']
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  const dbRoles = await prisma.role.findMany()
  const roleMap = Object.fromEntries(dbRoles.map(r => [r.name, r.id]))
  const dbPerms = await prisma.permission.findMany()
  const permMap = Object.fromEntries(dbPerms.map(p => [p.name, p.id]))

  const assignPerms = async (roleName: string, perms: string[]) => {
    const roleId = roleMap[roleName]
    if (!roleId) return
    for (const p of perms) {
      const permissionId = permMap[p]
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId }
        })
      }
    }
  }

  await assignPerms('admin', allPermNames)
  await assignPerms('player', ['communications:manage', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'attendance:view', 'annotations:view'])
  await assignPerms('captain', ['roster:manage', 'events:manage', 'communications:manage', 'injuries:manage', 'rivals:manage', 'plays:manage', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'finance:view', 'attendance:manage', 'attendance:view', 'annotations:view', 'annotations:manage'])
  await assignPerms('coach', ['events:manage', 'communications:manage', 'injuries:manage', 'plays:manage', 'resources:manage', 'roster:view', 'injuries:view', 'plays:view', 'resources:view', 'events:view', 'statistics:view', 'attendance:manage', 'attendance:view', 'annotations:view', 'annotations:manage'])
  await assignPerms('treasurer', ['finance:manage', 'finance:view', 'roster:view', 'events:view', 'statistics:view'])
  await assignPerms('guest', ['events:view', 'roster:view', 'injuries:view', 'rivals:view', 'plays:view', 'resources:view', 'statistics:view', 'annotations:view'])
}

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
  
  // Get seed users and workflow users to preserve their roles across multi-step tests
  const seedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: ['frankalfonso1988@gmail.com', 'guest@sigedivo.com', 'player@sigedivo.com', 'captain@sigedivo.com', 'coach@sigedivo.com', 'treasurer@sigedivo.com'] } },
        { email: { contains: 'workflow+' } },
      ]
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
        notIn: ['frankalfonso1988@gmail.com', 'guest@sigedivo.com', 'player@sigedivo.com', 'captain@sigedivo.com', 'coach@sigedivo.com', 'treasurer@sigedivo.com'],
        contains: 'tmp-test-',
      }
    }
  })
  
  // Ensure all core seed users have their roles intact
  const coreRolesMap = [
    { email: 'frankalfonso1988@gmail.com', roles: ['admin', 'player'] },
    { email: 'captain@sigedivo.com', roles: ['captain', 'player'] },
    { email: 'coach@sigedivo.com', roles: ['coach', 'player'] },
    { email: 'treasurer@sigedivo.com', roles: ['treasurer', 'player'] },
    { email: 'player@sigedivo.com', roles: ['player'] },
    { email: 'guest@sigedivo.com', roles: ['guest'] },
  ]

  for (const item of coreRolesMap) {
    const usr = await prisma.user.findUnique({ where: { email: item.email } })
    if (usr) {
      for (const rName of item.roles) {
        const r = await prisma.role.findUnique({ where: { name: rName } })
        if (r) {
          await prisma.userRole.upsert({
            where: { userId_roleId: { userId: usr.id, roleId: r.id } },
            update: {},
            create: { userId: usr.id, roleId: r.id }
          }).catch(() => {})
        }
      }
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
  const testEmail = email || `test-${Date.now()}@sigedivo.com`
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
