const fs = require('fs');
let code = fs.readFileSync('apps/web/src/lib/api.ts', 'utf8');

code = code.replace(/http\.interceptors\.request\.use\(\(config\) => \{/, 'http.interceptors.request.use((config: any) => {');
code = code.replace(/http\.interceptors\.response\.use\(\n  \(response\) => response,\n  \(error\) => \{/, 'http.interceptors.response.use(\n  (response: any) => response,\n  (error: any) => {');

fs.writeFileSync('apps/web/src/lib/api.ts', code);
