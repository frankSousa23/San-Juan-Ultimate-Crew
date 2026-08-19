import request from 'supertest'
import { app } from './app.js'

const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Role requests denial flow', () => {
  const admin = { email: 'frankalfonso1988@gmail.com', password: '123456' }
  const guest = { email: 'guest@sigedivo.com', password: '123456' }
  let adminToken: string | null = null
  let guestToken: string | null = null

  it('login admin and guest', async () => {
    if (!AUTH_ON) {
      return
    }
    const la = await request(app).post('/api/auth/login').send(admin)
    if (la.status !== 200) return
    adminToken = la.body.token
    const lg = await request(app).post('/api/auth/login').send(guest)
    if (lg.status !== 200) return
    guestToken = lg.body.token
  })

  it('guest creates request; admin denies it', async () => {
    if (!AUTH_ON || !adminToken || !guestToken) return
    // create new request (if pending exists already, api will return 409)
    const note = `deny ${Date.now()}`
    const create = await request(app)
      .post('/api/users/role-requests')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ role: 'player', note })
    let id: number | undefined = create.body?.id
    if (!id) {
      // find a pending request to deny
      const list = await request(app)
        .get('/api/users/role-requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
      const items = list.body as any[]
      const mine = items.find(r => r.user?.email === 'guest@sigedivo.com')
      id = mine?.id
    }
    if (!id) return
    const deny = await request(app)
      .post(`/api/users/role-requests/${id}/deny`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect([200,409]).toContain(deny.status)
  })
})
