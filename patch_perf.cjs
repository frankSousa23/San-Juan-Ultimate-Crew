const fs = require('fs');
let code = fs.readFileSync('apps/web/src/utils/performance.tsx', 'utf8');

code = code.replace(/bundleOptimization\.routeSplitting\[route\]\(\)/g, '(bundleOptimization.routeSplitting as any)[route]()');
code = code.replace(/refs: React\.RefObject<any>\[\]/g, 'refs: React.MutableRefObject<any>[]');

fs.writeFileSync('apps/web/src/utils/performance.tsx', code);
