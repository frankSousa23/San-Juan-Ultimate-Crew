import request from 'supertest'
import { app } from './app.js'

describe('Players CRUD', () => {
  let createdId: number | null = null
  const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'
  let authHeader: string | undefined

  beforeAll(async () => {
    if (AUTH_ON) {
      let login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'frankalfonso1988@gmail.com', password: 'passWORD23' })
      if (login.status !== 200) {
        login = await request(app)
          .post('/api/auth/login')
          .send({ email: 'frankalfonso1988@gmail.com', password: '123456' })
      }
      const token = (login.body && login.body.token) || ''
      authHeader = token ? `Bearer ${token}` : undefined
    }
  })

  it('should create a player', async () => {
    const number = Math.floor(100 + Math.random() * 800)
    let req = request(app).post('/api/players')
    if (authHeader) req = req.set('Authorization', authHeader)
    const r = await req
      .send({ name: 'Test Player', number, position: 'CUTTER', status: 'ACTIVE' })
      .expect(201)
    expect(r.body?.id).toBeTruthy()
    createdId = r.body.id
  })

  it('should list players and include the created one', async () => {
    let req = request(app).get('/api/players')
    if (authHeader) req = req.set('Authorization', authHeader)
    const r = await req.expect(200)
    expect(Array.isArray(r.body)).toBe(true)
    if (createdId) {
      expect(r.body.some((p: any) => p.id === createdId)).toBe(true)
    }
  })

  it('should update the player', async () => {
    if (!createdId) return
    let req = request(app).put(`/api/players/${createdId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    const r = await req.send({ status: 'INJURED' }).expect(200)
    expect(r.body?.status).toBe('INJURED')
  })

  it('should delete the player', async () => {
    if (!createdId) return
    let req = request(app).delete(`/api/players/${createdId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    await req.expect(204)
    let getReq = request(app).get('/api/players')
    if (authHeader) getReq = getReq.set('Authorization', authHeader)
    const r = await getReq.expect(200)
    expect(r.body.some((p: any) => p.id === createdId)).toBe(false)
  })
})
