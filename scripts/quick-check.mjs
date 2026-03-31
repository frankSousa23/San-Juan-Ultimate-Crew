import { run } from './_run.mjs'

run('npm', ['-w', 'apps/api', 'run', 'lint'])
run('npm', ['-w', 'apps/web', 'run', 'lint'])
run('npm', ['-w', 'apps/api', 'run', 'build'])
run('npm', ['-w', 'apps/web', 'run', 'build'])

console.log('Quick check OK.')

