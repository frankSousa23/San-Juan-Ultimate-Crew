#!/usr/bin/env node
/*
 Automated system check: brings up dependencies, builds, starts services,
 runs API unit tests and Web e2e tests, validates auth flow, and writes
 a timestamped Markdown report under reports/.
*/

const { spawn } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

function run(cmd, args = [], options = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: true, ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()))
    child.stderr.on('data', (d) => (stderr += d.toString()))
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

async function runWithTimeout(ms, fn, label) {
  const start = Date.now()
  let timedOut = false
  const timeout = new Promise((resolve) => setTimeout(() => { timedOut = true; resolve({ code: -1, stdout: '', stderr: `${label || 'step'} timed out after ${ms}ms` }) }, ms))
  const res = await Promise.race([Promise.resolve().then(fn), timeout])
  const durationMs = Date.now() - start
  return { ...res, durationMs, timedOut }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await run('node', ['-e', `fetch('${url}').then(r=>{console.log(r.status)}).catch(()=>process.exit(1))`]);
    if (/^200/m.test(res.stdout)) return true;
    await wait(1000);
  }
  return false;
}

function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function main() {
  const stamp = now();
  mkdirSync('reports', { recursive: true });
  const sections = [];
  const timings = [];

  // Global hard timeout guard (10 minutes)
  const overallStart = Date.now()
  const overallTimeoutMs = Number(process.env.CHECK_TIMEOUT_MS || 10 * 60 * 1000)
  const watchdog = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error(`Global timeout reached: ${overallTimeoutMs}ms. Forcing exit.`)
    process.exit(3)
  }, overallTimeoutMs)
  watchdog.unref && watchdog.unref()

  const isFull = String(process.env.CHECK_FULL || '0') === '1'

  sections.push(`# System Check Report ${stamp}`);

  // 1) Ensure DB up
  sections.push('## Database');
  const dbRes = await runWithTimeout(60_000, async () => run('docker', ['compose', 'up', '-d']), 'docker compose up')
  timings.push(`DB up: ${dbRes.durationMs}ms${dbRes.timedOut ? ' (TIMEOUT)' : ''}`)
  sections.push('```\n' + (dbRes.stdout || '') + (dbRes.stderr || '') + '\n```');

  // 2) Build workspaces
  sections.push('## Build');
  if (isFull) {
    const buildRes = await runWithTimeout(5 * 60_000, async () => run('npm', ['run', 'build']), 'npm run build')
    timings.push(`Build: ${buildRes.durationMs}ms${buildRes.timedOut ? ' (TIMEOUT)' : ''}`)
    sections.push('```\n' + (buildRes.stdout || '') + (buildRes.stderr || '') + '\n```');
  } else {
    sections.push('Skipped (fast mode). Set CHECK_FULL=1 to enable.')
  }

  // 3) API health (no dev spawn here; CI/E2E se encargan de iniciar si hace falta)
  sections.push('## API Health');
  const apiHealthy = await waitForUrl('http://localhost:4000/health', 2000)
  timings.push(`API health wait: ${apiHealthy ? 'OK' : 'FAILED'}`)
  sections.push(`API health: ${apiHealthy ? 'OK' : 'FAILED'}`);

  // 4) Web dev server presence (no spawn; solo observación)
  sections.push('## Web Dev Presence');
  const webUp = await waitForUrl('http://localhost:5173', 2000)
  timings.push(`Web up wait: ${webUp ? 'OK' : 'FAILED'}`)
  sections.push(`Web dev server: ${webUp ? 'OK' : 'FAILED'}`);

  // 5) Auth/Login sanity (use existing helper if present)
  sections.push('## Auth/Login Check');
  let authRes = { code: 0, stdout: '', stderr: '', durationMs: 0, timedOut: false }
  if (isFull) {
    authRes = await runWithTimeout(60_000, async () => run('node', ['apps/api/scripts/test-auth.cjs']), 'auth check')
    timings.push(`Auth check: ${authRes.durationMs}ms${authRes.timedOut ? ' (TIMEOUT)' : ''}`)
    sections.push('```\n' + (authRes.stdout || '') + (authRes.stderr || '') + '\n```');
  } else {
    sections.push('Skipped (fast mode). Set CHECK_FULL=1 to enable.')
  }

  // 6) API unit tests
  sections.push('## API Tests');
  let apiTests = { code: 0, stdout: '', stderr: '', durationMs: 0, timedOut: false }
  if (isFull) {
    apiTests = await runWithTimeout(5 * 60_000, async () => run('npm', ['--workspace', 'apps/api', 'run', 'test']), 'api tests')
    timings.push(`API tests: ${apiTests.durationMs}ms${apiTests.timedOut ? ' (TIMEOUT)' : ''}`)
    sections.push('```\n' + (apiTests.stdout || '') + (apiTests.stderr || '') + '\n```');
  } else {
    sections.push('Skipped (fast mode). Set CHECK_FULL=1 to enable.')
  }

  // 7) Web e2e tests
  sections.push('## Web E2E Tests');
  let webTests = { code: 0, stdout: '', stderr: '', durationMs: 0, timedOut: false }
  if (isFull) {
    webTests = await runWithTimeout(5 * 60_000, async () => run('npm', ['--workspace', 'apps/web', 'run', 'test:e2e']), 'web e2e')
    timings.push(`Web e2e: ${webTests.durationMs}ms${webTests.timedOut ? ' (TIMEOUT)' : ''}`)
    sections.push('```\n' + (webTests.stdout || '') + (webTests.stderr || '') + '\n```');
  } else {
    sections.push('Skipped (fast mode). Set CHECK_FULL=1 to enable.')
  }

  // 8) Asegurar salida limpia (no dejamos procesos vivos aquí)

  // 9) Summary and recommendations
  sections.push('## Summary');
  sections.push(`- API health: ${apiHealthy ? '**OK**' : '**FAILED**'}`);
  sections.push(`- Web dev server: ${webUp ? '**OK**' : '**FAILED**'}`);
  if (isFull) {
    sections.push(`- Auth check exit: ${authRes.code === 0 ? '**OK**' : '**FAILED**'}`);
    sections.push(`- API tests exit: ${apiTests.code === 0 ? '**OK**' : '**FAILED**'}`);
    sections.push(`- Web e2e exit: ${webTests.code === 0 ? '**OK**' : '**FAILED**'}`);
  } else {
    sections.push(`- Fast mode: build/tests skipped`)
  }
  const overallMs = Date.now() - overallStart
  sections.push('\n## Timings')
  sections.push(timings.map(t => `- ${t}`).join('\n'))
  sections.push(`- Total: ${overallMs}ms (timeout: ${overallTimeoutMs}ms)`) 

  sections.push('\n## Next Improvements');
  sections.push('- Enforce route guards in frontend based on roles (protected routes).');
  sections.push('- Cache API responses with SWR/React Query (limited TTL) to reduce bursts.');
  sections.push('- Add rate-limit headers to UI logs to detect throttling conditions.');
  sections.push('- Add CI job to run this script on each push and archive the report.');

  const outPath = join('reports', `system-check-${stamp}.md`);
  writeFileSync(outPath, sections.join('\n\n'), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Report written to ${outPath}`);
  // exit explícito para evitar manejadores pendientes
  clearTimeout(watchdog)
  process.exit(0)
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


