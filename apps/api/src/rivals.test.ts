import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Rivals API', () => {
  let rivalId: number
  let authHeader: string | undefined

  beforeAll(async () => {
    if (AUTH_ON) {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'frankalfonso1988@gmail.com', password: '123456' })
      const token = (login.body && login.body.token) || ''
      authHeader = token ? `Bearer ${token}` : undefined
    }
  })

  it('should list all rivals', async () => {
    const res = await request(app).get('/api/rivals')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should list rivals with pagination', async () => {
    const res = await request(app).get('/api/rivals/paged?limit=10&offset=0')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('limit')
    expect(res.body).toHaveProperty('offset')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should search rivals by name', async () => {
    const res = await request(app).get('/api/rivals/paged?q=test')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should create a rival', async () => {
    let req = request(app).post('/api/rivals')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({
      name: 'Test Rival Team',
      strengths: 'Strong offense',
      weaknesses: 'Weak defense'
    })
    expect([201, 401, 403]).toContain(res.status)
    if (res.status === 201) {
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toBe('Test Rival Team')
      expect(res.body.strengths).toBe('Strong offense')
      rivalId = res.body.id
    }
  })

  it('should find created rival in list', async () => {
    if (!rivalId) return
    const res = await request(app).get('/api/rivals')
    expect(res.status).toBe(200)
    const found = res.body.find((r: { id: number }) => r.id === rivalId)
    expect(found).toBeDefined()
    expect(found.name).toBe('Test Rival Team')
  })

  it('should update a rival', async () => {
    if (!rivalId) return
    let req = request(app).put(`/api/rivals/${rivalId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({ weaknesses: 'Updated weaknesses' })
    expect([200, 401, 403]).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.weaknesses).toBe('Updated weaknesses')
    }
  })

  it('should delete a rival', async () => {
    if (!rivalId) return
    let req = request(app).delete(`/api/rivals/${rivalId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req
    expect([204, 401, 403]).toContain(res.status)
  })

  it('should handle update with invalid id', async () => {
    let req = request(app).put('/api/rivals/99999')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({ name: 'Updated' })
    expect(res.status).toBeGreaterThanOrEqual(400)
  }, 10000)

  it('should validate required fields on create', async () => {
    let req = request(app).post('/api/rivals')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({})
    expect([400, 401, 403]).toContain(res.status)
  })

  it('should validate pagination parameters', async () => {
    const res = await request(app).get('/api/rivals/paged?limit=invalid')
    expect(res.status).toBe(400)
  })
})

