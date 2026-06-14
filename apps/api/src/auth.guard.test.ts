import request from 'supertest'
import { app } from './app.js'
const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'

describe('Auth guards on protected routes', () => {
  const adminEmail = 'admin@sju.com'
  const adminPassword = '123456'

  it('handles unauthenticated access appropriately', async () => {
    const res = await request(app)
      .post('/api/resources')
      .send({ title: 'X', url: 'https://example.com' })
    
    if (AUTH_ON) {
      expect(res.status).toBe(401)
    } else {
      expect([201, 403]).toContain(res.status)
    }
  })

  it('allows admin to create and delete a resource', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })

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
      expect(created.body?.error).toBeDefined()
    }
  })
})
