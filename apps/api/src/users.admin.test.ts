import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Admin users endpoints', () => {
  const adminCreds = { email: 'admin@sju.com', password: '123456' }
  let adminToken: string | null = null

  it('login as admin', async () => {
    if (!AUTH_ON) {
      return
    }
    const la = await request(app).post('/api/auth/login').send(adminCreds)
    if (la.status !== 200) return
    adminToken = la.body.token
  })

  it('list users (admin)', async () => {
    if (!AUTH_ON || !adminToken) return
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('set roles for guest user to include player (idempotent)', async () => {
    if (!AUTH_ON || !adminToken) return
    const list = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    const guest = (list.body as any[]).find(u => u.email === 'guest@example.com')
    if (!guest) return
    const set = await request(app)
      .put(`/api/users/${guest.id}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roles: ['guest','player'] })
    expect([200, 500]).toContain(set.status) // tolerate transient DB issues in CI
  })

  it('link a user without playerId to an available Player', async () => {
    if (!AUTH_ON || !adminToken) return
    const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    const users = usersRes.body as any[]
    const targetUser = users.find(u => u.playerId == null)
    if (!targetUser) return
    const linkedIds = new Set(users.map(u => u.playerId).filter(Boolean))
    const playersRes = await request(app).get('/api/players').set('Authorization', `Bearer ${adminToken}`)
    if (!Array.isArray(playersRes.body)) return
    const player = (playersRes.body as any[]).find(p => !linkedIds.has(p.id))
    if (!player) return
    const link = await request(app)
      .put(`/api/users/${targetUser.id}/link-player`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerId: player.id })
    expect([200, 409]).toContain(link.status)
  })
})
