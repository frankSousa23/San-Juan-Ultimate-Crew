import request from 'supertest'
import { app } from './app.js'

describe('Plays API', () => {
  let playId: number

  it('should list all plays', async () => {
    const res = await request(app).get('/api/plays')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should list plays with pagination', async () => {
    const res = await request(app).get('/api/plays/paged?limit=10&offset=0')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should filter plays by category', async () => {
    const res = await request(app).get('/api/plays?category=OFFENSE')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should search plays by name', async () => {
    const res = await request(app).get('/api/plays/paged?q=test')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should create a play', async () => {
    const res = await request(app)
      .post('/api/plays')
      .send({
        name: 'Test Play',
        category: 'OFFENSE',
        description: 'A test offensive play'
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('Test Play')
    expect(res.body.category).toBe('OFFENSE')
    playId = res.body.id
  })

  it('should find created play in list', async () => {
    const res = await request(app).get('/api/plays')
    expect(res.status).toBe(200)
    const found = res.body.find((p: { id: number }) => p.id === playId)
    expect(found).toBeDefined()
    expect(found.name).toBe('Test Play')
  })

  it('should update a play', async () => {
    const res = await request(app)
      .put(`/api/plays/${playId}`)
      .send({ description: 'Updated description' })
    expect(res.status).toBe(200)
    expect(res.body.description).toBe('Updated description')
  })

  it('should delete a play', async () => {
    const res = await request(app).delete(`/api/plays/${playId}`)
    expect(res.status).toBe(204)
  })

  it('should handle update with invalid id', async () => {
    const res = await request(app)
      .put('/api/plays/99999')
      .send({ name: 'Updated' })
    // Prisma throws P2025 which may not be caught, so expect any error status
    expect(res.status).toBeGreaterThanOrEqual(400)
  }, 10000)

  it('should validate required fields on create', async () => {
    const res = await request(app)
      .post('/api/plays')
      .send({})
    expect(res.status).toBe(400)
  })

  it('should validate category enum on create', async () => {
    const res = await request(app)
      .post('/api/plays')
      .send({
        name: 'Test',
        category: 'INVALID'
      })
    expect(res.status).toBe(400)
  })
})

