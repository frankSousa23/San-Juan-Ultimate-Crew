const fs = require('fs');
let code = fs.readFileSync('apps/web/src/lib/api.ts', 'utf8');
code = code.replace(/return config; => \{/, '');
fs.writeFileSync('apps/web/src/lib/api.ts', code);
