const axios = require('axios')

const base = process.env.SMOKE_BASE || 'http://localhost:4000'
const timeoutMs = Number.parseInt(process.env.WAIT_TIMEOUT_MS || '20000', 10)
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

;(async () => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await axios.get(base + '/health', { timeout: 2000 })
      if (r.status === 200) {
        console.log('HEALTH_OK', r.status)
        process.exit(0)
      }
    } catch (_) {
      // ignore until timeout
    }
    await sleep(500)
  }
  console.error('HEALTH_TIMEOUT after', timeoutMs, 'ms at', base + '/health')
  process.exit(1)
})()
