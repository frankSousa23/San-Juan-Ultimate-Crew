const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/Resources.tsx', 'utf8');

code = code.replace(/onUploadProgress: \(evt\) => \{[\s\S]*?\}\n/g, '');

fs.writeFileSync('apps/web/src/pages/Resources.tsx', code);
