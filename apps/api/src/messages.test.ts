import request from 'supertest'
import { app } from './app.js'

describe('Messages API', () => {
  let channelId: number
  let messageId: number
  let playerId: number

  beforeAll(async () => {
    // Create a channel for testing
    const channelRes = await request(app)
      .post('/api/channels')
      .send({ name: 'Test Channel for Messages' })
    channelId = channelRes.body.id

    // Get a player for testing (or create one if needed)
    const playersRes = await request(app).get('/api/players')
    if (playersRes.body.length > 0) {
      playerId = playersRes.body[0].id
    } else {
      // Create a test player
      const playerRes = await request(app)
        .post('/api/players')
        .send({ name: 'Test Player', number: 999, position: 'HYBRID', status: 'ACTIVE' })
      playerId = playerRes.body.id
    }
  })

  it('should list messages for a channel', async () => {
    const res = await request(app).get(`/api/messages?channelId=${channelId}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should create a message', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({
        channelId,
        authorId: playerId,
        content: 'Test message content'
      })
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
    const res = await request(app)
      .post('/api/messages')
      .send({})
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

