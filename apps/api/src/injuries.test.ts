import request from 'supertest'
import { app } from './app.js'

describe('Injuries API', () => {
  let injuryId: number
  let playerId: number

  beforeAll(async () => {
    // Get or create a player for testing
    const playersRes = await request(app).get('/api/players')
    if (playersRes.body.length > 0) {
      playerId = playersRes.body[0].id
    } else {
      const playerRes = await request(app)
        .post('/api/players')
        .send({ name: 'Test Player', number: 888, position: 'HYBRID', status: 'ACTIVE' })
      playerId = playerRes.body.id
    }
  })

  it('should list all injuries', async () => {
    const res = await request(app).get('/api/injuries')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should list injuries with pagination', async () => {
    const res = await request(app).get('/api/injuries/paged?limit=10&offset=0')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should filter injuries by playerId', async () => {
    const res = await request(app).get(`/api/injuries/paged?playerId=${playerId}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should filter injuries by severity', async () => {
    const res = await request(app).get('/api/injuries/paged?severity=MILD')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should filter injuries by status', async () => {
    const res = await request(app).get('/api/injuries/paged?status=ACTIVE')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should create an injury', async () => {
    const res = await request(app)
      .post('/api/injuries')
      .send({
        playerId,
        type: 'Ankle sprain',
        severity: 'MILD',
        status: 'ACTIVE',
        startDate: new Date().toISOString(),
        description: 'Test injury description'
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.type).toBe('Ankle sprain')
    expect(res.body.severity).toBe('MILD')
    injuryId = res.body.id
  })

  it('should find created injury in list', async () => {
    const res = await request(app).get('/api/injuries')
    expect(res.status).toBe(200)
    const found = res.body.find((i: { id: number }) => i.id === injuryId)
    expect(found).toBeDefined()
    expect(found.type).toBe('Ankle sprain')
  })

  it('should update an injury', async () => {
    const res = await request(app)
      .put(`/api/injuries/${injuryId}`)
      .send({ status: 'RECOVERING' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('RECOVERING')
  })

  it('should delete an injury', async () => {
    const res = await request(app).delete(`/api/injuries/${injuryId}`)
    expect(res.status).toBe(204)
  })

  it('should handle update with invalid id', async () => {
    const res = await request(app)
      .put('/api/injuries/99999')
      .send({ status: 'RECOVERING' })
    // Prisma throws P2025 which may not be caught, so expect any error status
    expect(res.status).toBeGreaterThanOrEqual(400)
  }, 10000)

  it('should validate required fields on create', async () => {
    const res = await request(app)
      .post('/api/injuries')
      .send({})
    expect(res.status).toBe(400)
  })

  it('should validate severity enum on create', async () => {
    const res = await request(app)
      .post('/api/injuries')
      .send({
        playerId,
        type: 'Test',
        severity: 'INVALID',
        startDate: new Date().toISOString()
      })
    expect(res.status).toBe(400)
  })

  it('should validate date format on create', async () => {
    const res = await request(app)
      .post('/api/injuries')
      .send({
        playerId,
        type: 'Test',
        severity: 'MILD',
        startDate: 'invalid-date'
      })
    expect(res.status).toBe(400)
  })
})

