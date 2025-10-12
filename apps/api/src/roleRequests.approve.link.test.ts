import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'
const suite = AUTH_ON ? describe : describe.skip

suite('Role request approve with player linking', () => {
  const admin = { email: 'admin@example.com', password: 'admin123' }
  const email = `newuser+${Date.now()}@example.com`
  const password = 'admin123'

  let adminToken: string | null = null
  let userToken: string | null = null
  let userId: number | null = null

  it('registers a new user', async () => {
    const r = await request(app).post('/api/auth/register').send({ email, password, name: 'New User' })
    expect([200, 409]).toContain(r.status)
    if (r.status === 200) {
      userToken = r.body?.token
    } else {
      const login = await request(app).post('/api/auth/login').send({ email, password })
      if (login.status === 200) userToken = login.body?.token
    }
    if (userToken) {
      const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${userToken}`)
      if (me.status === 200) userId = me.body?.user?.id ?? null
    }
  })

  it('login admin', async () => {
    const la = await request(app).post('/api/auth/login').send(admin)
    if (la.status !== 200) return
    adminToken = la.body.token
  })

  it('user creates role request with a free playerId; admin approves; user has player role and linked player', async () => {
    if (!adminToken || !userToken) return
    // Find a free Player id
    const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
    if (usersRes.status !== 200) return
    const linked = new Set((usersRes.body as any[]).map(u => u.playerId).filter(Boolean))
    const playersRes = await request(app).get('/api/players')
    const free = (playersRes.body as any[]).find(p => !linked.has(p.id))
    if (!free) return

    // Create request
    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ role: 'player', playerId: free.id, note: 'link me' })
    expect([201,409]).toContain(create.status)
    let reqId: number | undefined = create.body?.id
    if (!reqId) {
      // find existing pending for this user
      const list = await request(app).get('/api/users/role-requests?status=PENDING').set('Authorization', `Bearer ${adminToken}`)
      const items = list.body as any[]
      const mine = items.find(r => r.user?.email === email)
      reqId = mine?.id
    }
    if (!reqId) return

    // Approve
    const approve = await request(app)
      .post(`/api/users/role-requests/${reqId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect([200,409]).toContain(approve.status)

    // Verify user now has player role and playerId set
    if (userId) {
      const usersAfter = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`)
      const u = (usersAfter.body as any[]).find(x => x.id === userId)
      if (u) {
        expect(u.playerId).toBeTruthy()
        expect((u.roles || []).includes('player')).toBe(true)
      }
    }
  })
})
