const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/memoryOptimization.tsx', 'utf8');

code = code.replace(/refs: React\.RefObject<any>\[\]/g, 'refs: React.MutableRefObject<any>[]');

fs.writeFileSync('apps/web/src/services/memoryOptimization.tsx', code);
