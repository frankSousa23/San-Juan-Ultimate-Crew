const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/compressionService.tsx', 'utf8');

code = code.replace(/getAlgorithmColor\(operation\.algorithm\)/g, 'getAlgorithmColor(operation.algorithm as any)');

fs.writeFileSync('apps/web/src/services/compressionService.tsx', code);
