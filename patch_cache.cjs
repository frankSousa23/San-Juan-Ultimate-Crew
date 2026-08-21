const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/cacheService.ts', 'utf8');
code = code.replace(/import \{ useDataCache \} from '\.\.\/hooks\/useOptimization'/g, '// import { useDataCache } from "../hooks/useOptimization"');
fs.writeFileSync('apps/web/src/services/cacheService.ts', code);
