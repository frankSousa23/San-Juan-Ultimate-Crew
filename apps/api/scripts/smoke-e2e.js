const axios = require('axios')

const base = process.env.SMOKE_BASE || 'http://localhost:4000'
const sleep = (ms) => new Promise(res => setTimeout(res, ms))

;(async () => {
  const log = []
  const push = (k, v) => log.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
  try {
    // Wait for API
    let ready = false
    for (let i = 0; i < 20; i++) {
      try {
        const h = await axios.get(base + '/health', { timeout: 2000 })
        push('1) /health', h.status)
        ready = true
        break
      } catch { await sleep(500) }
    }
    if (!ready) throw new Error('API not ready')

    // Player
    const player = (await axios.post(base + '/api/players', { name: 'QA Bot', number: Math.floor(1000 + Math.random()*9000), position: 'HANDLER', status: 'ACTIVE' })).data
    push('2) player', { id: player.id, number: player.number })

    // Event
    const event = (await axios.post(base + '/api/events', { title: 'QA Event', type: 'TRAINING', startsAt: new Date().toISOString() })).data
    push('3) event', { id: event.id })

    // Attendance
    const att = (await axios.put(base + '/api/attendance', { eventId: event.id, playerId: player.id, status: 'present', note: 'ok' })).data
    push('4) attendance', { id: `${att.eventId}:${att.playerId}`, status: att.status })

    // Channel + Message
    const channel = (await axios.post(base + '/api/channels', { name: 'canal-qa-' + Date.now(), eventId: event.id })).data
    push('5) channel', { id: channel.id })
    const msg = (await axios.post(base + '/api/messages', { channelId: channel.id, content: 'hola qa' })).data
    push('6) message', { id: msg.id })

    // Finance
    const cat = (await axios.post(base + '/api/categories', { name: 'QA', kind: 'EXPENSE' })).data
    const acct = (await axios.post(base + '/api/accounts', { name: 'QA Caja', type: 'CASH' })).data
    const txn = (await axios.post(base + '/api/transactions', { amount: 1.23, type: 'EXPENSE', accountId: acct.id, categoryId: cat.id, description: 'qa' })).data
    push('7) finance', { txn: txn.id })

    // Rivals / Plays / Injuries
    const rival = (await axios.post(base + '/api/rivals', { name: 'Rival QA' })).data
    push('8) rival', { id: rival.id })
    const play = (await axios.post(base + '/api/plays', { name: 'Play QA', category: 'OFFENSIVE', description: 'md' })).data
    push('9) play', { id: play.id })
    let inj = (await axios.post(base + '/api/injuries', { playerId: player.id, type: 'Tobillo', severity: 'MILD', startDate: new Date().toISOString() })).data
    push('10) injury', { id: inj.id, status: inj.status })
    inj = (await axios.put(base + `/api/injuries/${inj.id}`, { status: 'RECOVERING' })).data
    push('11) injury-update', { id: inj.id, status: inj.status })

    // Cleanup best-effort
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
  } catch (e) {
    console.error('SMOKE_E2E_ERROR', e?.response?.status, e?.response?.data || e?.message)
    console.log('SMOKE_E2E_SUMMARY\n' + log.join('\n'))
    process.exit(1)
  }
})()
