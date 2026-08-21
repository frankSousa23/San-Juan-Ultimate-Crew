const fs = require('fs');
let code = fs.readFileSync('apps/web/src/hooks/useOptimization.ts', 'utf8');

code = code.replace(/Object\.values\(item\)/g, 'Object.values(item as any)');

fs.writeFileSync('apps/web/src/hooks/useOptimization.ts', code);
