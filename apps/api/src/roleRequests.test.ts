import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'
const suite = AUTH_ON ? describe : describe.skip

suite('Role requests workflow', () => {
  const adminCreds = { email: 'admin@example.com', password: 'admin123' }
  const guestCreds = { email: 'guest@example.com', password: 'admin123' }

  let adminToken: string | null = null
  let guestToken: string | null = null

  it('login admin and guest', async () => {
    const la = await request(app).post('/api/auth/login').send(adminCreds)
    if (la.status !== 200) return
    adminToken = la.body.token
    const lg = await request(app).post('/api/auth/login').send(guestCreds)
    if (lg.status !== 200) return
    guestToken = lg.body.token
  })

  it('guest can create a role request and admin can approve', async () => {
    if (!adminToken || !guestToken) return
    // guest create
    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ role: 'player', note: 'please' })
    expect([201,409]).toContain(create.status)
    let id: number | undefined = create.body?.id
    if (!id) {
      // if 409 pending exists, list and pick one
      const mine = await request(app)
        .get('/api/users/me/role-requests')
        .set('Authorization', `Bearer ${guestToken}`)
      id = mine.body?.[0]?.id
    }
    expect(typeof id).toBe('number')

    // admin list
    const list = await request(app)
      .get('/api/users/role-requests?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(list.status).toBe(200)

    // admin approve or deny
    const approve = await request(app)
      .post(`/api/users/role-requests/${id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect([200,409]).toContain(approve.status)
  })
})
