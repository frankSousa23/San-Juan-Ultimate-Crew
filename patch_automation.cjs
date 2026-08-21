const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/automationService.tsx', 'utf8');

code = code.replace(/tasks: \['backup-database', 'cleanup-logs', 'optimize-assets'\],\n        schedule: '0 1 \* \* \*',/g, "tasks: ['backup-database', 'cleanup-logs', 'optimize-assets'],\n        triggers: [],\n        schedule: '0 1 * * *',");

code = code.replace(/tasks: \['optimize-assets', 'cleanup-logs', 'run-tests'\],\n        schedule: '0 2 \* \* 0',/g, "tasks: ['optimize-assets', 'cleanup-logs', 'run-tests'],\n        triggers: [],\n        schedule: '0 2 * * 0',");

fs.writeFileSync('apps/web/src/services/automationService.tsx', code);
