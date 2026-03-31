import { spawnSync } from 'node:child_process'

function resolveCommand(cmd) {
  if (process.platform !== 'win32') return cmd
  // On Windows, npm/npx are typically available as .cmd shims.
  if (cmd === 'npm') return 'npm.cmd'
  if (cmd === 'npx') return 'npx.cmd'
  return cmd
}

export function run(cmd, args, options = {}) {
  const res = spawnSync(resolveCommand(cmd), args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  })

  if (res.error) throw res.error
  if (typeof res.status === 'number' && res.status !== 0) {
    process.exit(res.status)
  }
}

export function runShell(command, options = {}) {
  // Use system shell for simple cross-platform commands.
  const isWin = process.platform === 'win32'
  const shell = isWin ? 'cmd.exe' : 'bash'
  const args = isWin ? ['/d', '/s', '/c', command] : ['-lc', command]
  run(shell, args, options)
}

