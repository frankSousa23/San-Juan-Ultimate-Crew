// Runs the auth guard test with AUTH_REQUIRED=true via npm to be cross-platform
const { spawn } = require('child_process')
const env = { ...process.env, AUTH_REQUIRED: 'true' }
const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const args = ['run', 'test', '--', 'src/auth.guard.test.ts']
const child = spawn(cmd, args, { stdio: 'inherit', env, shell: false })
child.on('exit', (code) => process.exit(code ?? 0))
