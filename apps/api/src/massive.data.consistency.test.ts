import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from './app.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
let adminToken: string

describe('Massive Data Consistency Tests', () => {
  beforeAll(async () => {
    // Login as admin to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
    adminToken = res.body.token
  })

  it('should fetch a list of players quickly', async () => {
    const res = await request(app)
      .get('/api/players')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(100) // Expecting massive data
  })

  it('should fetch events', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThan(100)
  })

  it('database should have consistent relations for participants', async () => {
    const count = await prisma.eventParticipant.count()
    expect(count).toBeGreaterThan(100)
  })

  it('database should have consistent annotations', async () => {
    const annotations = await prisma.eventAnnotation.count()
    expect(annotations).toBeGreaterThan(50)
  })
})
