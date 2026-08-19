import request from 'supertest'
import { app } from './app.js'

describe('Event Participants API', () => {
  let eventId: number | null = null
  let playerId: number | null = null
  const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'
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

  it('bootstraps: gets events and players', async () => {
    let evReq = request(app).get('/api/events')
    if (authHeader) evReq = evReq.set('Authorization', authHeader)
    const evs = await evReq.expect(200)

    let plReq = request(app).get('/api/players')
    if (authHeader) plReq = plReq.set('Authorization', authHeader)
    const pls = await plReq.expect(200)
    expect(Array.isArray(evs.body)).toBe(true)
    expect(Array.isArray(pls.body)).toBe(true)
    expect(evs.body.length).toBeGreaterThan(0)
    expect(pls.body.length).toBeGreaterThan(0)
    eventId = evs.body[0].id
    playerId = pls.body[0].id
  })

  it('upserts a participant with role and status', async () => {
    if (!eventId || !playerId) return
    let req = request(app).put('/api/event-participants')
    if (authHeader) req = req.set('Authorization', authHeader)
    const r = await req
      .send({ eventId, playerId, role: 'Handler', status: 'confirmed' })
      .expect(200)
    expect(r.body?.eventId).toBe(eventId)
    expect(r.body?.playerId).toBe(playerId)
  })

  it('lists participants by event', async () => {
    if (!eventId) return
    const r = await request(app)
      .get('/api/event-participants')
      .query({ eventId })
      .expect(200)
    expect(Array.isArray(r.body)).toBe(true)
  })

  it('deletes the participant', async () => {
    if (!eventId || !playerId) return
    let req = request(app).delete('/api/event-participants')
    if (authHeader) req = req.set('Authorization', authHeader)
    await req.query({ eventId, playerId }).expect(204)
  })
})
