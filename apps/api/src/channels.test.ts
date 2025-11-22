import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Channels API', () => {
  let channelId: number
  let authHeader: string | undefined

  beforeAll(async () => {
    if (AUTH_ON) {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'admin123' })
      const token = (login.body && login.body.token) || ''
      authHeader = token ? `Bearer ${token}` : undefined
    }
  })

  it('should list all channels', async () => {
    const res = await request(app).get('/api/channels')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should create a channel', async () => {
    let req = request(app).post('/api/channels')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({ name: 'Test Channel' })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('Test Channel')
    channelId = res.body.id
  })

  it('should get a channel by id', async () => {
    if (!channelId) return
    const res = await request(app).get(`/api/channels/${channelId}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(channelId)
    expect(res.body.name).toBe('Test Channel')
  })

  it('should list channels filtered by eventId', async () => {
    const res = await request(app).get('/api/channels?eventId=999')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should return 404 for non-existent channel', async () => {
    const res = await request(app).get('/api/channels/99999')
    expect(res.status).toBe(404)
  })

  it('should validate required fields on create', async () => {
    let req = request(app).post('/api/channels')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({})
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(400)
  })
})

