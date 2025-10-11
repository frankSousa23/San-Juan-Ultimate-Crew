import request from 'supertest'
import { app } from './app.js'

describe('Players CRUD', () => {
  let createdId: number | null = null

  it('should create a player', async () => {
    const number = Math.floor(1000 + Math.random() * 9000)
    const r = await request(app)
      .post('/api/players')
      .send({ name: 'Test Player', number, position: 'CUTTER', status: 'ACTIVE' })
      .expect(201)
    expect(r.body?.id).toBeTruthy()
    createdId = r.body.id
  })

  it('should list players and include the created one', async () => {
    const r = await request(app).get('/api/players').expect(200)
    expect(Array.isArray(r.body)).toBe(true)
    if (createdId) {
      expect(r.body.some((p: any) => p.id === createdId)).toBe(true)
    }
  })

  it('should update the player', async () => {
    if (!createdId) return
    const r = await request(app)
      .put(`/api/players/${createdId}`)
      .send({ status: 'INJURED' })
      .expect(200)
    expect(r.body?.status).toBe('INJURED')
  })

  it('should delete the player', async () => {
    if (!createdId) return
    await request(app).delete(`/api/players/${createdId}`).expect(204)
    const r = await request(app).get('/api/players').expect(200)
    expect(r.body.some((p: any) => p.id === createdId)).toBe(false)
  })
})
