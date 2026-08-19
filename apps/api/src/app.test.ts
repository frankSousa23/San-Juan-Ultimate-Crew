import request from 'supertest'
import { app } from './app.js'

describe('API basic routes', () => {
  it('GET /health should return 200 and ok', async () => {
    const r = await request(app).get('/health')
    expect(r.status).toBe(200)
  })

  it('GET / should return name and ok', async () => {
    const r = await request(app).get('/')
    expect(r.status).toBe(200)
    expect(r.body?.name).toBe('SIGEDIVO (Sistema de Gestión para el Disco Volador) API')
    expect(r.body?.ok).toBe(true)
  })
})
