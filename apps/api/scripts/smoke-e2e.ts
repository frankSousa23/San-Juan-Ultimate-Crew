import axios from 'axios'

const base = process.env.SMOKE_BASE || 'http://localhost:4000'
const p = (o: any) => JSON.stringify(o)
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

interface TestResult {
  name: string
  status: 'pass' | 'fail'
  message?: string
  data?: any
}

async function main() {
  const results: TestResult[] = []
  const push = (name: string, status: 'pass' | 'fail', message?: string, data?: any) => {
    results.push({ name, status, message, data })
  }
  
  try {
    // 1) Health check (retry until ready)
    let healthOk = false
    for (let i = 0; i < 30; i++) {
      try {
        const h = await axios.get(base + '/health', { timeout: 2000 })
        if (h.status === 200 && h.data?.ok) {
          push('1) /health', 'pass', `Status: ${h.status}`, h.data)
          healthOk = true
          break
        }
      } catch (e: any) {
        if (i === 29) {
          push('1) /health', 'fail', `API not ready after 30 attempts: ${e.message}`)
        }
      }
      await sleep(500)
    }
    if (!healthOk) throw new Error('API not ready')
    
    // 1b) Database health check
    try {
      const dbHealth = await axios.get(base + '/health/db', { timeout: 5000 })
      if (dbHealth.status === 200 && dbHealth.data?.ok) {
        push('1b) /health/db', 'pass', 'Database connected', dbHealth.data)
      } else {
        push('1b) /health/db', 'fail', 'Database health check failed')
      }
    } catch (e: any) {
      push('1b) /health/db', 'fail', `Database health check error: ${e.message}`)
    }

    // 2) Player create
    try {
      const player = (await axios.post(base + '/api/players', { 
        name: 'QA Bot', 
        number: Math.floor(1000 + Math.random()*9000), 
        position: 'HANDLER', 
        status: 'ACTIVE' 
      })).data
      push('2) POST /api/players', 'pass', 'Player created', { id: player.id, number: player.number })

      // 3) Event create
      const event = (await axios.post(base + '/api/events', { 
        title: 'QA Event', 
        type: 'TRAINING', 
        startsAt: new Date().toISOString() 
      })).data
      push('3) POST /api/events', 'pass', 'Event created', { id: event.id, title: event.title })

      // 4) Attendance upsert
      const att = (await axios.put(base + '/api/attendance', { 
        eventId: event.id, 
        playerId: player.id, 
        status: 'present', 
        note: 'ok' 
      })).data
      push('4) PUT /api/attendance', 'pass', 'Attendance recorded', { 
        id: `${att.eventId}:${att.playerId}`, 
        status: att.status 
      })

      // 5) Channel + message
      const channel = (await axios.post(base + '/api/channels', { 
        name: 'canal-qa-' + Date.now(), 
        eventId: event.id 
      })).data
      push('5) POST /api/channels', 'pass', 'Channel created', { id: channel.id, name: channel.name })
      
      const msg = (await axios.post(base + '/api/messages', { 
        channelId: channel.id, 
        content: 'hola qa' 
      })).data
      push('6) POST /api/messages', 'pass', 'Message created', { id: msg.id })

      // 6) Finanzas (category, account, transaction)
      const cat = (await axios.post(base + '/api/categories', { 
        name: 'QA', 
        kind: 'EXPENSE' 
      })).data
      const acct = (await axios.post(base + '/api/accounts', { 
        name: 'QA Caja', 
        type: 'CASH' 
      })).data
      const txn = (await axios.post(base + '/api/transactions', { 
        amountCents: 123, 
        occurredAt: new Date().toISOString(), 
        type: 'EXPENSE', 
        accountId: acct.id, 
        categoryId: cat.id, 
        description: 'qa' 
      })).data
      push('7) POST /api/transactions', 'pass', 'Transaction created', { txn: txn.id })

      // 7) Rivals / Plays / Injuries
      const rival = (await axios.post(base + '/api/rivals', { name: 'Rival QA' })).data
      push('8) POST /api/rivals', 'pass', 'Rival created', { id: rival.id })
      
      const play = (await axios.post(base + '/api/plays', { 
        name: 'Play QA', 
        category: 'OFFENSE', 
        description: 'md' 
      })).data
      push('9) POST /api/plays', 'pass', 'Play created', { id: play.id })
      
      let inj = (await axios.post(base + '/api/injuries', { 
        playerId: player.id, 
        type: 'Tobillo', 
        severity: 'MILD', 
        startDate: new Date().toISOString() 
      })).data
      push('10) POST /api/injuries', 'pass', 'Injury created', { id: inj.id, status: inj.status })
      
      inj = (await axios.put(base + `/api/injuries/${inj.id}`, { status: 'RECOVERING' })).data
      push('11) PUT /api/injuries/:id', 'pass', 'Injury updated', { id: inj.id, status: inj.status })

      // 8) Cleanup (best-effort)
      const cleanupResults = await Promise.allSettled([
        axios.delete(base + `/api/injuries/${inj.id}`),
        axios.delete(base + `/api/plays/${play.id}`),
        axios.delete(base + `/api/rivals/${rival.id}`),
        axios.delete(base + `/api/transactions/${txn.id}`),
        axios.delete(base + `/api/categories/${cat.id}`),
        axios.delete(base + `/api/accounts/${acct.id}`),
        axios.delete(base + `/api/players/${player.id}`),
        axios.delete(base + `/api/events/${event.id}`),
      ])
      const cleanupSuccess = cleanupResults.filter(r => r.status === 'fulfilled').length
      push('12) Cleanup', cleanupSuccess === cleanupResults.length ? 'pass' : 'fail', 
        `Cleaned up ${cleanupSuccess}/${cleanupResults.length} resources`)

    } catch (e: any) {
      push('Error in test flow', 'fail', e?.response?.data || e?.message, {
        status: e?.response?.status,
        url: e?.config?.url
      })
    }

    // Print summary
    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length
    const total = results.length

    console.log('\n=== SMOKE TEST SUMMARY ===')
    results.forEach(r => {
      const icon = r.status === 'pass' ? '✅' : '❌'
      console.log(`${icon} ${r.name}: ${r.status.toUpperCase()}`)
      if (r.message) console.log(`   ${r.message}`)
      if (r.data) console.log(`   Data: ${p(r.data)}`)
    })
    console.log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`)
    
    if (failed > 0) {
      console.error('\n❌ Smoke tests failed!')
      process.exit(1)
    } else {
      console.log('\n✅ All smoke tests passed!')
      process.exit(0)
    }
  } catch (e: any) {
    console.error('FATAL ERROR:', e?.message || e)
    console.error('Stack:', e?.stack)
    process.exit(1)
  }
}

main()
