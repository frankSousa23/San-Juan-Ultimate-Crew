import request from 'supertest'
import fs from 'fs'
import path from 'path'
import { app } from './app.js'

describe('Resources API', () => {
  let createdId: number | null = null
  const AUTH_ON = String(process.env.AUTH_REQUIRED || 'false').toLowerCase() === 'true'
  let authHeader: string | undefined

  beforeAll(async () => {
    if (AUTH_ON) {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@example.com', password: 'admin123' })
      const token = (login.body && login.body.token) || ''
      authHeader = token ? `Bearer ${token}` : undefined
    }
  })

  it('should create a resource with URL', async () => {
    let req = request(app).post('/api/resources')
    if (authHeader) req = req.set('Authorization', authHeader)
    const r = await req
      .send({ title: 'Doc QA', url: 'https://example.com/doc', description: 'qa', category: 'TEST' })
      .expect(201)
    expect(r.body?.id).toBeTruthy()
    createdId = r.body.id
  })

  it('should list resources (paged) with category filter', async () => {
    const r = await request(app)
      .get('/api/resources/paged')
      .query({ category: 'TEST', limit: 10, offset: 0 })
      .expect(200)
    expect(Array.isArray(r.body?.items)).toBe(true)
  })

  it('should update resource title', async () => {
    if (!createdId) return
    let req = request(app).put(`/api/resources/${createdId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    const r = await req.send({ title: 'Doc QA v2' }).expect(200)
    expect(r.body?.title).toBe('Doc QA v2')
  })

  it('should upload a file as a resource', async () => {
    const tmp = path.resolve(process.cwd(), 'apps', 'api', 'uploads', 'tmp-test.txt')
    fs.writeFileSync(tmp, 'hello qa')
    let req = request(app).post('/api/resources/upload')
    if (authHeader) req = req.set('Authorization', authHeader)
    const r = await req.attach('file', tmp).field('category', 'TEST').expect(201)
    expect(r.body?.id).toBeTruthy()
    // cleanup file: API creates a copy under uploads/, tmp can be removed
    fs.unlinkSync(tmp)
  })

  it('should delete the created resource', async () => {
    if (!createdId) return
    let req = request(app).delete(`/api/resources/${createdId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    await req.expect(204)
  })
})
