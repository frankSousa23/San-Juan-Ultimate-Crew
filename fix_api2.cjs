const fs = require('fs');
let code = fs.readFileSync('apps/web/src/lib/api.ts', 'utf8');
code = code.replace(/request: \{ use: \(\) => \{\} \},/g, 'request: { use: (cb: any) => {} },');
code = code.replace(/response: \{ use: \(\) => \{\} \},/g, 'response: { use: (cb1: any, cb2: any) => {} },');
fs.writeFileSync('apps/web/src/lib/api.ts', code);
