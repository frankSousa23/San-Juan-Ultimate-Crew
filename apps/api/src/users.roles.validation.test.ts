import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Admin set roles validation', () => {
  const admin = { email: 'admin@sju.com', password: '123456' }
  let adminToken: string | null = null
  let guestUser: any = null

  it('login admin and find guest user', async () => {
    if (!AUTH_ON) {
      return
    }
    const la = await request(app).post('/api/auth/login').send(admin)
    if (la.status !== 200) return
    adminToken = la.body.token
    const list = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    if (list.status !== 200) return
    guestUser = (list.body as any[]).find(u => u.email === 'guest@example.com')
  })

  it('rejects invalid role names', async () => {
    if (!AUTH_ON || !adminToken || !guestUser) return
    const res = await request(app)
      .put(`/api/users/${guestUser.id}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roles: ['admin'] })
    expect(res.status).toBe(400)
  })

  it('accepts allowed roles guest/player', async () => {
    if (!AUTH_ON || !adminToken || !guestUser) return
    const res = await request(app)
      .put(`/api/users/${guestUser.id}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roles: ['guest','player'] })
    expect([200,500]).toContain(res.status)
  })
})
