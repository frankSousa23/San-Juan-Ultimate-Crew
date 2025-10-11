import request from 'supertest'
import { app } from './app.js'

describe('Finances API', () => {
  it('lists transactions (paged) and returns total/limit/offset', async () => {
    const r = await request(app)
      .get('/api/transactions')
      .query({ limit: 5, offset: 0 })
      .expect(200)
    expect(Array.isArray(r.body?.items)).toBe(true)
    expect(typeof r.body?.total).toBe('number')
    expect(r.body?.limit).toBe(5)
    expect(r.body?.offset).toBe(0)
  })

  it('computes overall summary with income/expense/balance', async () => {
    const r = await request(app)
      .get('/api/transactions/summary/overall')
      .expect(200)
    expect(typeof r.body?.income).toBe('number')
    expect(typeof r.body?.expense).toBe('number')
    expect(typeof r.body?.balance).toBe('number')
    // sanity: balance = income - expense
    expect(r.body.balance).toBe(r.body.income - r.body.expense)
  })
})
