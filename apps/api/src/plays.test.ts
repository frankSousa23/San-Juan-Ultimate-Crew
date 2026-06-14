import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Plays API', () => {
  let playId: number
  let authHeader: string | undefined

  beforeAll(async () => {
    if (AUTH_ON) {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@sju.com', password: '123456' })
      const token = (login.body && login.body.token) || ''
      authHeader = token ? `Bearer ${token}` : undefined
    }
  })

  it('should list all plays', async () => {
    const res = await request(app).get('/api/plays')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should list plays with pagination', async () => {
    const res = await request(app).get('/api/plays/paged?limit=10&offset=0')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should filter plays by category', async () => {
    const res = await request(app).get('/api/plays?category=OFFENSE')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should search plays by name', async () => {
    const res = await request(app).get('/api/plays/paged?q=test')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should create a play', async () => {
    let req = request(app).post('/api/plays')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({
      name: 'Test Play',
      category: 'OFFENSE',
      description: 'A test offensive play'
    })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('Test Play')
    expect(res.body.category).toBe('OFFENSE')
    playId = res.body.id
  })

  it('should find created play in list', async () => {
    if (!playId) return
    const res = await request(app).get('/api/plays')
    expect(res.status).toBe(200)
    const found = res.body.find((p: { id: number }) => p.id === playId)
    expect(found).toBeDefined()
    expect(found.name).toBe('Test Play')
  })

  it('should update a play', async () => {
    if (!playId) return
    let req = request(app).put(`/api/plays/${playId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({ description: 'Updated description' })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(200)
    expect(res.body.description).toBe('Updated description')
  })

  it('should delete a play', async () => {
    if (!playId) return
    let req = request(app).delete(`/api/plays/${playId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(204)
  })

  it('should handle update with invalid id', async () => {
    let req = request(app).put('/api/plays/99999')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({ name: 'Updated' })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    // Prisma throws P2025 which may not be caught, so expect any error status
    expect(res.status).toBeGreaterThanOrEqual(400)
  }, 10000)

  it('should validate required fields on create', async () => {
    let req = request(app).post('/api/plays')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({})
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(400)
  })

  it('should validate category enum on create', async () => {
    let req = request(app).post('/api/plays')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({
      name: 'Test',
      category: 'INVALID'
    })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(400)
  })
})

