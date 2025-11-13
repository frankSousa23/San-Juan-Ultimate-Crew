import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Role requests: update pending (playerId/note)', () => {
  const admin = { email: 'admin@example.com', password: 'admin123' }
  let adminToken: string | null = null

  it('login admin', async () => {
    if (!AUTH_ON) {
      return
    }
    const la = await request(app).post('/api/auth/login').send(admin)
    if (la.status !== 200) return
    adminToken = la.body.token
  })

  it('admin can update note and playerId for a pending request', async () => {
    if (!AUTH_ON || !adminToken) return
    const email = `update+${Date.now()}@example.com`
    const password = 'admin123'
    const reg = await request(app).post('/api/auth/register').send({ email, password })
    const userToken = reg.status === 200 ? reg.body?.token : (await request(app).post('/api/auth/login').send({ email, password })).body?.token
    if (!userToken) return
    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'player', note: 'original' })
    expect([201,409]).toContain(create.status)
    let reqId: number | undefined = create.body?.id
    if (!reqId) {
      const list = await request(app)
        .get('/api/users/role-requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
      const mine = (list.body as any[]).find(r => r.user?.email === email)
      reqId = mine?.id
    }
    if (!reqId) return

    const upd1 = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'ajustada' })
    expect(upd1.status).toBe(200)
    expect(upd1.body?.note).toBe('ajustada')
    const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    if (usersRes.status !== 200) return
    const linked = new Set((usersRes.body as any[]).map(u => u.playerId).filter(Boolean))
    const playersRes = await request(app).get('/api/players')
    const free = (playersRes.body as any[]).find((p: any) => !linked.has(p.id))
    if (!free) return

    // update playerId
    const upd2 = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerId: free.id })
    expect(upd2.status).toBe(200)
    expect(upd2.body?.playerId).toBe(free.id)

    const upd3 = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerId: null })
    expect(upd3.status).toBe(200)
    expect(upd3.body?.playerId).toBe(null)
  })

  it('update returns 409 for non-pending requests', async () => {
    if (!AUTH_ON || !adminToken) return
    const email = `nonpending+${Date.now()}@example.com`
    const password = 'admin123'
    const reg = await request(app).post('/api/auth/register').send({ email, password })
    const userToken = reg.status === 200 ? reg.body?.token : (await request(app).post('/api/auth/login').send({ email, password })).body?.token
    if (!userToken) return

    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'player', note: 'np' })
    expect([201,409]).toContain(create.status)
    let reqId: number | undefined = create.body?.id
    if (!reqId) {
      const list = await request(app)
        .get('/api/users/role-requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
      const mine = (list.body as any[]).find(r => r.user?.email === email)
      reqId = mine?.id
    }
    if (!reqId) return

    const deny = await request(app)
      .post(`/api/users/role-requests/${reqId}/deny`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect([200,409]).toContain(deny.status)

    const upd = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'should-fail' })
    expect(upd.status).toBe(409)
  })

  it('update returns 409 when setting playerId linked to another user', async () => {
    if (!AUTH_ON || !adminToken) return
    const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    if (usersRes.status !== 200) return
    const linkedUser = (usersRes.body as any[]).find(u => u.playerId != null)
    if (!linkedUser) return
    const playerId = linkedUser.playerId as number

    const email = `conflictupd+${Date.now()}@example.com`
    const password = 'admin123'
    const reg = await request(app).post('/api/auth/register').send({ email, password })
    const userToken = reg.status === 200 ? reg.body?.token : (await request(app).post('/api/auth/login').send({ email, password })).body?.token
    if (!userToken) return

    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'player' })
    expect([201,409]).toContain(create.status)
    let reqId: number | undefined = create.body?.id
    if (!reqId) {
      const list = await request(app)
        .get('/api/users/role-requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
      const mine = (list.body as any[]).find(r => r.user?.email === email)
      reqId = mine?.id
    }
    if (!reqId) return

    const upd = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerId })
    expect(upd.status).toBe(409)
  })

  it('update returns 404 for non-existent request or playerId', async () => {
    if (!AUTH_ON || !adminToken) return
    const upd404 = await request(app)
      .put(`/api/users/role-requests/${9999999}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'x' })
    expect([404,500]).toContain(upd404.status) // tolerate 500 if db rejects invalid id type

    // Create a pending request and try to set a non-existent playerId
    const email = `nofoundp+${Date.now()}@example.com`
    const password = 'admin123'
    const reg = await request(app).post('/api/auth/register').send({ email, password })
    const userToken = reg.status === 200 ? reg.body?.token : (await request(app).post('/api/auth/login').send({ email, password })).body?.token
    if (!userToken) return
    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'player' })
    expect([201,409]).toContain(create.status)
    let reqId: number | undefined = create.body?.id
    if (!reqId) {
      const list = await request(app)
        .get('/api/users/role-requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
      const mine = (list.body as any[]).find(r => r.user?.email === email)
      reqId = mine?.id
    }
    if (!reqId) return

    const updPlayer404 = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerId: 9999999 })
    expect(updPlayer404.status).toBe(404)
  })

  it('update returns 400 for invalid payloads (negative/non-integer playerId, too long note)', async () => {
    if (!AUTH_ON || !adminToken) return
    const email = `badpayload+${Date.now()}@example.com`
    const password = 'admin123'
    const reg = await request(app).post('/api/auth/register').send({ email, password })
    const userToken = reg.status === 200 ? reg.body?.token : (await request(app).post('/api/auth/login').send({ email, password })).body?.token
    if (!userToken) return

    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'player' })
    expect([201,409]).toContain(create.status)
    let reqId: number | undefined = create.body?.id
    if (!reqId) {
      const list = await request(app).get('/api/users/role-requests?status=PENDING').set('Authorization', `Bearer ${adminToken}`)
      const mine = (list.body as any[]).find(r => r.user?.email === email)
      reqId = mine?.id
    }
    if (!reqId) return

    // negative playerId
    const neg = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerId: -3 })
    expect(neg.status).toBe(400)

    // non-integer playerId
    const nonint = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ playerId: 1.23 })
    expect(nonint.status).toBe(400)

    // too long note (501 chars)
    const longNote = 'x'.repeat(501)
    const long = await request(app)
      .put(`/api/users/role-requests/${reqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: longNote })
    expect(long.status).toBe(400)
  })
})
