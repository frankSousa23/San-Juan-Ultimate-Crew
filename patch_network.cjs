const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/networkOptimization.ts', 'utf8');

code = code.replace(/requestQueue: RequestConfig\[\] = \[\]/g, 'requestQueue: any[] = []');
code = code.replace(/return cached/g, 'return cached as unknown as T');
code = code.replace(/return this\.queueRequest\(config\)/g, 'return this.queueRequest(config) as unknown as Promise<T>');

fs.writeFileSync('apps/web/src/services/networkOptimization.ts', code);
