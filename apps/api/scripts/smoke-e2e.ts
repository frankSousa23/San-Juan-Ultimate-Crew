import axios from 'axios'

const base = process.env.SMOKE_BASE || 'http://localhost:4000'
const p = (o: any) => JSON.stringify(o)
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

async function main() {
  const log: string[] = []
  const push = (k: string, v: any) => log.push(`${k}: ${typeof v === 'string' ? v : p(v)}`)
  try {
    // 1) Health (retry until ready)
    let ok = false
    for (let i = 0; i < 20; i++) {
      try {
        const h = await axios.get(base + '/health', { timeout: 2000 })
        push('1) /health', h.status)
        ok = true
        break
      } catch {
        await sleep(500)
      }
    }
    if (!ok) throw new Error('API not ready')

    // 2) Player create
    const player = (await axios.post(base + '/api/players', { name: 'QA Bot', number: Math.floor(1000 + Math.random()*9000), position: 'HANDLER', status: 'ACTIVE' })).data
    push('2) player', { id: player.id, number: player.number })

    // 3) Event create
    const event = (await axios.post(base + '/api/events', { title: 'QA Event', type: 'TRAINING', startsAt: new Date().toISOString() })).data
    push('3) event', { id: event.id, title: event.title })

    // 4) Attendance upsert
    const att = (await axios.put(base + '/api/attendance', { eventId: event.id, playerId: player.id, status: 'present', note: 'ok' })).data
    push('4) attendance', { id: att.eventId + ':' + att.playerId, status: att.status })

    // 5) Channel + message
    const channel = (await axios.post(base + '/api/channels', { name: 'canal-qa-' + Date.now(), eventId: event.id })).data
    push('5) channel', { id: channel.id, name: channel.name })
    const msg = (await axios.post(base + '/api/messages', { channelId: channel.id, content: 'hola qa' })).data
    push('6) message', { id: msg.id })

    // 6) Finanzas (category, account, transaction)
  const cat = (await axios.post(base + '/api/categories', { name: 'QA', kind: 'EXPENSE' })).data
  const acct = (await axios.post(base + '/api/accounts', { name: 'QA Caja', type: 'CASH' })).data
  const txn = (await axios.post(base + '/api/transactions', { amountCents: 123, occurredAt: new Date().toISOString(), type: 'EXPENSE', accountId: acct.id, categoryId: cat.id, description: 'qa' })).data
    push('7) finance', { txn: txn.id })

    // 7) Rivals / Plays / Injuries
    const rival = (await axios.post(base + '/api/rivals', { name: 'Rival QA' })).data
    push('8) rival', { id: rival.id })
  const play = (await axios.post(base + '/api/plays', { name: 'Play QA', category: 'OFFENSE', description: 'md' })).data
    push('9) play', { id: play.id })
    let inj = (await axios.post(base + '/api/injuries', { playerId: player.id, type: 'Tobillo', severity: 'MILD', startDate: new Date().toISOString() })).data
    push('10) injury', { id: inj.id, status: inj.status })
    inj = (await axios.put(base + `/api/injuries/${inj.id}`, { status: 'RECOVERING' })).data
    push('11) injury-update', { id: inj.id, status: inj.status })

    // 8) Cleanup (best-effort)
    await Promise.allSettled([
      axios.delete(base + `/api/injuries/${inj.id}`),
      axios.delete(base + `/api/plays/${play.id}`),
      axios.delete(base + `/api/rivals/${rival.id}`),
      axios.delete(base + `/api/transactions/${txn.id}`),
      axios.delete(base + `/api/categories/${cat.id}`),
      axios.delete(base + `/api/accounts/${acct.id}`),
      axios.delete(base + `/api/players/${player.id}`),
      axios.delete(base + `/api/events/${event.id}`),
    ])
    push('12) cleanup', 'OK')

    console.log('SMOKE_E2E_SUMMARY\n' + log.join('\n'))
    process.exit(0)
  } catch (e: any) {
    console.error('SMOKE_E2E_ERROR', e?.response?.status, e?.response?.data || e?.message)
    console.log('SMOKE_E2E_SUMMARY\n' + log.join('\n'))
    process.exit(1)
  }
}

main()
