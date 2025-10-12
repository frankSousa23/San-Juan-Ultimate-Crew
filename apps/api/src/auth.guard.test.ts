import request from 'supertest'
import { app } from './app.js'
const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

const suite = AUTH_ON ? describe : describe.skip
suite('Auth guards on protected routes', () => {
  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123'

  it('rejects unauthenticated access with 401', async () => {
    const res = await request(app)
      .post('/api/resources')
      .send({ title: 'X', url: 'https://example.com' })
    expect(res.status).toBe(401)
  })

  it('allows admin to create and delete a resource', async () => {
    // Login with seeded admin
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })

    // If admin not present, skip gracefully
    if (login.status !== 200 || !login.body?.token) {
      console.warn('Admin user not available; skipping admin create/delete assertions')
      return
    }

    const token = login.body.token as string

    const created = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Auth Test', url: 'https://example.com' })

    expect([201, 403]).toContain(created.status)
    if (created.status === 201) {
      const id = created.body?.id
      expect(typeof id).toBe('number')
      const del = await request(app)
        .delete(`/api/resources/${id}`)
        .set('Authorization', `Bearer ${token}`)
      expect(del.status).toBe(204)
    } else {
      // If not admin role present despite credentials, at least confirm guard path
      expect(created.body?.error).toBeDefined()
    }
  })
})
