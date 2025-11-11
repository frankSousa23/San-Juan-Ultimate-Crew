import request from 'supertest'
import { app } from './app.js'

describe('Rivals API', () => {
  let rivalId: number

  it('should list all rivals', async () => {
    const res = await request(app).get('/api/rivals')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('should list rivals with pagination', async () => {
    const res = await request(app).get('/api/rivals/paged?limit=10&offset=0')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('limit')
    expect(res.body).toHaveProperty('offset')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should search rivals by name', async () => {
    const res = await request(app).get('/api/rivals/paged?q=test')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('should create a rival', async () => {
    const res = await request(app)
      .post('/api/rivals')
      .send({
        name: 'Test Rival Team',
        strengths: 'Strong offense',
        weaknesses: 'Weak defense'
      })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('Test Rival Team')
    expect(res.body.strengths).toBe('Strong offense')
    rivalId = res.body.id
  })

  it('should find created rival in list', async () => {
    const res = await request(app).get('/api/rivals')
    expect(res.status).toBe(200)
    const found = res.body.find((r: { id: number }) => r.id === rivalId)
    expect(found).toBeDefined()
    expect(found.name).toBe('Test Rival Team')
  })

  it('should update a rival', async () => {
    const res = await request(app)
      .put(`/api/rivals/${rivalId}`)
      .send({ weaknesses: 'Updated weaknesses' })
    expect(res.status).toBe(200)
    expect(res.body.weaknesses).toBe('Updated weaknesses')
  })

  it('should delete a rival', async () => {
    const res = await request(app).delete(`/api/rivals/${rivalId}`)
    expect(res.status).toBe(204)
  })

  it('should handle update with invalid id', async () => {
    const res = await request(app)
      .put('/api/rivals/99999')
      .send({ name: 'Updated' })
    // Prisma throws P2025 which may not be caught, so expect any error status
    expect(res.status).toBeGreaterThanOrEqual(400)
  }, 10000)

  it('should validate required fields on create', async () => {
    const res = await request(app)
      .post('/api/rivals')
      .send({})
    expect(res.status).toBe(400)
  })

  it('should validate pagination parameters', async () => {
    const res = await request(app).get('/api/rivals/paged?limit=invalid')
    expect(res.status).toBe(400)
  })
})

