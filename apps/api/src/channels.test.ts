import request from 'supertest'
import { app } from './app.js'

describe('Channels API', () => {
  let channelId: number

  it('should list all channels', async () => {
    const res = await request(app).get('/api/channels')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should create a channel', async () => {
    const res = await request(app)
      .post('/api/channels')
      .send({ name: 'Test Channel' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('Test Channel')
    channelId = res.body.id
  })

  it('should get a channel by id', async () => {
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
    const res = await request(app)
      .post('/api/channels')
      .send({})
    expect(res.status).toBe(400)
  })
})

