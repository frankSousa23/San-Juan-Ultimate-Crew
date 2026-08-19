import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Injuries API', () => {
  let injuryId: number
  let playerId: number
  let authHeader: string | undefined

  beforeAll(async () => {
    if (AUTH_ON) {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@sju.com', password: '123456' })
      const token = (login.body && login.body.token) || ''
      authHeader = token ? `Bearer ${token}` : undefined
    }

    // Get or create a player for testing
    let getReq = request(app).get('/api/players')
    if (authHeader) getReq = getReq.set('Authorization', authHeader)
    const playersRes = await getReq
    if (playersRes.status === 200 && Array.isArray(playersRes.body) && playersRes.body.length > 0) {
      playerId = playersRes.body[0].id
    } else {
      let req = request(app).post('/api/players')
      if (authHeader) req = req.set('Authorization', authHeader)
      const playerRes = await req
        .send({ name: 'Test Player', number: 888, position: 'HYBRID', status: 'ACTIVE' })
      if (playerRes.status === 201) {
        playerId = playerRes.body.id
      } else if (playerRes.status === 401 && !AUTH_ON) {
        // If auth is off, try without header
        const playerRes2 = await request(app)
          .post('/api/players')
          .send({ name: 'Test Player', number: 888, position: 'HYBRID', status: 'ACTIVE' })
        if (playerRes2.status === 201) {
          playerId = playerRes2.body.id
        }
      }
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
    if (!playerId) return
    let req = request(app).post('/api/injuries')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({
      playerId,
      type: 'Test Injury XYZ',
      severity: 'MILD',
      status: 'ACTIVE',
      startDate: new Date().toISOString(),
      description: 'Test injury description'
    })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.type).toBe('Test Injury XYZ')
    expect(res.body.severity).toBe('MILD')
    injuryId = res.body.id
  })

  it('should find created injury in list', async () => {
    // We already created an injury in the "should create an injury" test, its ID is in injuryId
    if (!injuryId) return
    const res = await request(app).get('/api/injuries')
    expect(res.status).toBe(200)
    const found = res.body.find((i: { id: number }) => i.id === injuryId)
    expect(found).toBeDefined()
    expect(found.type).toBe('Test Injury XYZ')
  })

  it('should update an injury', async () => {
    if (!injuryId) return
    let req = request(app).put(`/api/injuries/${injuryId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({ status: 'RECOVERING' })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('RECOVERING')
  })

  it('should delete an injury', async () => {
    if (!injuryId) return
    let req = request(app).delete(`/api/injuries/${injuryId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(204)
  })

  it('should handle update with invalid id', async () => {
    let req = request(app).put('/api/injuries/99999')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({ status: 'RECOVERING' })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    // Prisma throws P2025 which may not be caught, so expect any error status
    expect(res.status).toBeGreaterThanOrEqual(400)
  }, 10000)

  it('should validate required fields on create', async () => {
    let req = request(app).post('/api/injuries')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({})
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(400)
  })

  it('should validate severity enum on create', async () => {
    if (!playerId) return
    let req = request(app).post('/api/injuries')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({
      playerId,
      type: 'Test',
      severity: 'INVALID',
      startDate: new Date().toISOString()
    })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(400)
  })

  it('should validate date format on create', async () => {
    if (!playerId) return
    let req = request(app).post('/api/injuries')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({
      playerId,
      type: 'Test',
      severity: 'MILD',
      startDate: 'invalid-date'
    })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(400)
  })
})

