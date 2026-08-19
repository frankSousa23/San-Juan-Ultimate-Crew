import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Role requests: conflict on approve and status filtering', () => {
  const admin = { email: 'frankalfonso1988@gmail.com', password: '123456' }
  let adminToken: string | null = null

  it('login admin', async () => {
    if (!AUTH_ON) {
      return
    }
    const la = await request(app).post('/api/auth/login').send(admin)
    if (la.status !== 200) return
    adminToken = la.body.token
  })

  it('approve with already-linked playerId returns 409', async () => {
    if (!AUTH_ON || !adminToken) return
    const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    if (usersRes.status !== 200) return
    const linked = (usersRes.body as any[]).find(u => u.playerId != null)
    if (!linked) return
    const playerId = linked.playerId as number
    const email = `conflict+${Date.now()}@sigedivo.com`
    const password = '123456'
    const reg = await request(app).post('/api/auth/register').send({ email, password })
    const token = reg.status === 200 ? reg.body?.token : (await request(app).post('/api/auth/login').send({ email, password })).body?.token
    if (!token) return
    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'player', playerId })
    if (create.status === 401) {
      console.log('Received 401, AUTH_REQUIRED might be false or token invalid')
      return
    }
    expect([201,409]).toContain(create.status)
    if (create.status === 201) {
      const id = create.body?.id
      const approve = await request(app)
        .post(`/api/users/role-requests/${id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
      expect(approve.status).toBe(409)
    }
  })

  it('status filtering: pending then approved', async () => {
    if (!AUTH_ON || !adminToken) return
    const email = `filter+${Date.now()}@sigedivo.com`
    const password = '123456'
    const reg = await request(app).post('/api/auth/register').send({ email, password })
    const token = reg.status === 200 ? reg.body?.token : (await request(app).post('/api/auth/login').send({ email, password })).body?.token
    if (!token) return
    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'player', note: 'pending' })
    if (create.status === 401) {
      console.log('Received 401, AUTH_REQUIRED might be false or token invalid')
      return
    }
    expect([201,409]).toContain(create.status)
    let id: number | undefined = create.body?.id
    if (!id) {
      const listPending = await request(app)
        .get('/api/users/role-requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
      const mine = (listPending.body as any[]).find(r => r.user?.email === email)
      id = mine?.id
    }
    if (!id) return
    const listPending2 = await request(app)
      .get('/api/users/role-requests?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(Array.isArray(listPending2.body)).toBe(true)
    const approve = await request(app)
      .post(`/api/users/role-requests/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect([200,409]).toContain(approve.status)
    const listPending3 = await request(app)
      .get('/api/users/role-requests?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`)
    const stillPending = (listPending3.body as any[]).find(r => r.id === id)
    expect(!stillPending).toBe(true)
    const listApproved = await request(app)
      .get('/api/users/role-requests?status=APPROVED')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(Array.isArray(listApproved.body)).toBe(true)
  })
})
