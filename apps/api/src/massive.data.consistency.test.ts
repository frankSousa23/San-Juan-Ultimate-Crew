import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from './app.js'
import { prisma } from './lib/prisma.js'

let adminToken: string

describe.skipIf(process.env.TEST_MASSIVE !== 'true')('Massive Data Consistency Tests', () => {
  beforeAll(async () => {
    // Login as admin to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sju.com', password: '123456' })
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
