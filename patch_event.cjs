const fs = require('fs');
let code = fs.readFileSync('apps/web/src/types/event.ts', 'utf8');

code = code.replace(/isInternalScrimmage\?: boolean/, 'isInternalScrimmage?: boolean\n  children?: EventItem[]');

fs.writeFileSync('apps/web/src/types/event.ts', code);
