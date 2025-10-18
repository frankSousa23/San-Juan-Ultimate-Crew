import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

// Setup global test database
beforeAll(async () => {
  // Reset database
  execSync('npx prisma migrate reset --force', { stdio: 'inherit' })
  
  // Run migrations
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  
  // Seed test data
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up test data between tests
  await prisma.roleRequest.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.user.deleteMany({
    where: {
      email: {
        not: 'admin@example.com' // Keep admin user
      }
    }
  })
})

export { prisma }
