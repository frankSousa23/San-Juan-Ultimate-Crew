const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/testingService.tsx', 'utf8');

code = code.replace(/await this\.runTestSuite\(suite\)/g, 'await this.runTestSuite(suite.id)');

fs.writeFileSync('apps/web/src/services/testingService.tsx', code);
