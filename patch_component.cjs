const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/componentOptimization.tsx', 'utf8');

code = code.replace(/as React\.ComponentType<P>/g, 'as unknown as React.ComponentType<P>');

fs.writeFileSync('apps/web/src/services/componentOptimization.tsx', code);
