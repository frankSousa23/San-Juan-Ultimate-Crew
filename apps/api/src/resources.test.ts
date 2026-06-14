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
        .send({ email: 'admin@sju.com', password: '123456' })
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
    const tmpDir = path.resolve(process.cwd(), 'apps', 'api', 'uploads')
    const tmpFile = path.join(tmpDir, `tmp-test-${Date.now()}.txt`)
    let uploadedResourceId: number | null = null
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
      fs.writeFileSync(tmpFile, 'hello qa')
      let req = request(app).post('/api/resources/upload')
      if (authHeader) req = req.set('Authorization', authHeader)
      const r = await req.attach('file', tmpFile).field('category', 'TEST').expect(201)
      expect(r.body?.id).toBeTruthy()
      uploadedResourceId = r.body.id
      const uploadedFile = r.body?.storagePath ? path.resolve(process.cwd(), r.body.storagePath.replace(/^\//, '')) : null
      if (uploadedFile && fs.existsSync(uploadedFile)) {
        fs.unlinkSync(uploadedFile)
      }
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
      if (uploadedResourceId && authHeader) {
        try {
          await request(app)
            .delete(`/api/resources/${uploadedResourceId}`)
            .set('Authorization', authHeader)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  })

  it('should delete the created resource', async () => {
    if (!createdId) return
    let req = request(app).delete(`/api/resources/${createdId}`)
    if (authHeader) req = req.set('Authorization', authHeader)
    await req.expect(204)
  })
})
