import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Messages API', () => {
  let channelId: number
  let messageId: number
  let playerId: number
  let authHeader: string | undefined

  beforeAll(async () => {
    if (AUTH_ON) {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'frankalfonso1988@gmail.com', password: '123456' })
      const token = (login.body && login.body.token) || ''
      authHeader = token ? `Bearer ${token}` : undefined
    }

    // Create a channel for testing
    let req = request(app).post('/api/channels')
    if (authHeader) req = req.set('Authorization', authHeader)
    const channelRes = await req.send({ name: 'Test Channel for Messages' })
    
    if (channelRes.status === 201) {
      channelId = channelRes.body.id
    } else if (channelRes.status === 401 && !AUTH_ON) {
      // If auth is off, try without header
      const channelRes2 = await request(app)
        .post('/api/channels')
        .send({ name: 'Test Channel for Messages' })
      if (channelRes2.status === 201) {
        channelId = channelRes2.body.id
      }
    }

    // Get a player for testing (or create one if needed)
    const playersRes = await request(app).get('/api/players')
    if (playersRes.body.length > 0) {
      playerId = playersRes.body[0].id
    } else {
      // Create a test player
      let req = request(app).post('/api/players')
      if (authHeader) req = req.set('Authorization', authHeader)
      const playerRes = await req
        .send({ name: 'Test Player', number: 999, position: 'HYBRID', status: 'ACTIVE' })
      if (playerRes.status === 201) {
        playerId = playerRes.body.id
      } else if (playerRes.status === 401 && !AUTH_ON) {
        // If auth is off, try without header
        const playerRes2 = await request(app)
          .post('/api/players')
          .send({ name: 'Test Player', number: 999, position: 'HYBRID', status: 'ACTIVE' })
        if (playerRes2.status === 201) {
          playerId = playerRes2.body.id
        }
      }
    }
  })

  it('should list messages for a channel', async () => {
    const res = await request(app).get(`/api/messages?channelId=${channelId}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should create a message', async () => {
    if (!channelId || !playerId) return
    let req = request(app).post('/api/messages')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({
      channelId,
      authorId: playerId,
      content: 'Test message content'
    })
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.content).toBe('Test message content')
    expect(res.body.channelId).toBe(channelId)
    messageId = res.body.id
  })

  it('should list messages with limit parameter', async () => {
    const res = await request(app).get(`/api/messages?channelId=${channelId}&limit=5`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should list messages with before parameter', async () => {
    const before = new Date().toISOString()
    const res = await request(app).get(`/api/messages?channelId=${channelId}&before=${before}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should list messages with since parameter', async () => {
    const since = new Date(Date.now() - 86400000).toISOString() // 1 day ago
    const res = await request(app).get(`/api/messages?channelId=${channelId}&since=${since}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should validate required fields on create', async () => {
    let req = request(app).post('/api/messages')
    if (authHeader) req = req.set('Authorization', authHeader)
    const res = await req.send({})
    
    if (AUTH_ON && !authHeader) {
      expect(res.status).toBe(401)
      return
    }
    
    expect(res.status).toBe(400)
  })

  it('should validate limit parameter', async () => {
    const res = await request(app).get(`/api/messages?channelId=${channelId}&limit=invalid`)
    expect(res.status).toBe(400)
  })

  it('should validate limit is within range', async () => {
    const res = await request(app).get(`/api/messages?channelId=${channelId}&limit=200`)
    expect(res.status).toBe(400)
  })
})

