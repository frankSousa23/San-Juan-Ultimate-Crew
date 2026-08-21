const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/About.tsx', 'utf8');

code = code.replace(/downloadSystemManualPdf\('Manual_Operaciones_SIGEDIVO\.pdf'\)/, 'downloadSystemManualPdf()');

fs.writeFileSync('apps/web/src/pages/About.tsx', code);
