const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/documentationService.tsx', 'utf8');

code = code.replace(/import React, \{ useState \} from 'react'/, "import React, { useState, useMemo } from 'react'");
code = code.replace(/\(item\) =>/g, '(item: any) =>');
code = code.replace(/\(tag\) =>/g, '(tag: any) =>');
code = code.replace(/\(example\) =>/g, '(example: any) =>');

fs.writeFileSync('apps/web/src/services/documentationService.tsx', code);
