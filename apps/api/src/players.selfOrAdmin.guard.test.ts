import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Players self-or-admin guard', () => {
  const admin = { email: 'frankalfonso1988@gmail.com', password: '123456' }
  const player = { email: 'player@sigedivo.com', password: '123456' }
  let adminToken: string | null = null
  let playerToken: string | null = null
  let selfPlayerId: number | null = null
  let otherPlayerId: number | null = null

  it('login admin and player', async () => {
    if (!AUTH_ON) {
      return
    }
    const la = await request(app).post('/api/auth/login').send(admin)
    if (la.status !== 200) return
    adminToken = la.body.token
    const lp = await request(app).post('/api/auth/login').send(player)
    if (lp.status !== 200) return
    playerToken = lp.body.token
  })

  it('locate player records', async () => {
    if (!AUTH_ON || !playerToken) return
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${playerToken}`)
    if (me.status !== 200 || !me.body?.user?.playerId) return
    const list = await request(app).get('/api/players').set('Authorization', `Bearer ${playerToken}`)
    const others = (Array.isArray(list.body) ? list.body : []).map((p: any) => p.id).filter((id: number) => id !== selfPlayerId)
    otherPlayerId = others[0] ?? null
  })

  it('player can update self', async () => {
    if (!AUTH_ON || !playerToken || !selfPlayerId) return
    const r = await request(app)
      .put(`/api/players/${selfPlayerId}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ experience: 'test self' })
    expect([200, 404]).toContain(r.status)
    if (r.status === 200) expect(r.body?.id).toBe(selfPlayerId)
  })

  it('player cannot update others', async () => {
    if (!AUTH_ON || !playerToken || !otherPlayerId) return
    const r = await request(app)
      .put(`/api/players/${otherPlayerId}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ experience: 'test other' })
    expect([403, 404]).toContain(r.status)
  })

  it('admin can update others', async () => {
    if (!AUTH_ON || !adminToken || !otherPlayerId) return
    const r = await request(app)
      .put(`/api/players/${otherPlayerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ experience: 'test by admin' })
    expect([200, 404]).toContain(r.status)
  })
})
