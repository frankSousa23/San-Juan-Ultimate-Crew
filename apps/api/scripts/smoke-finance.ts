import axios from 'axios'

async function main() {
  const baseURL = process.env.API_URL || 'http://localhost:4001'
  const http = axios.create({ baseURL })

  // 1) Accounts & Categories
  const accounts = (await http.get('/api/accounts')).data as any[]
  const categories = (await http.get('/api/categories')).data as any[]
  if (!accounts.length) throw new Error('No accounts available')

  const accountId = accounts[0].id
  const categoryId = categories.find((c: any) => c.kind === 'INCOME')?.id

  // 2) Create a transaction
  const payload = {
    type: 'INCOME',
    amountCents: 12345,
    occurredAt: new Date().toISOString(),
    accountId,
    categoryId,
    description: 'SmokeTest Income',
  }
  const created = (await http.post('/api/transactions', payload)).data

  // 3) List and verify presence
  const list = (await http.get('/api/transactions', { params: { limit: 5, offset: 0 } })).data
  const found = list.items.find((i: any) => i.id === created.id)
  if (!found) throw new Error('Created transaction not found in list')

  // 4) Summary
  const summary = (await http.get('/api/transactions/summary/overall')).data
  if (typeof summary.income !== 'number') throw new Error('Invalid summary response')

  // 5) Cleanup
  await http.delete(`/api/transactions/${created.id}`)

  console.log('Finance smoke test: OK')
}

main().catch((e) => { console.error('Finance smoke test: FAIL'); console.error(e?.response?.data || e.message || e); process.exit(1) })
