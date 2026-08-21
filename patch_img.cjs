const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/imageOptimization.tsx', 'utf8');

code = code.replace(/import React, \{ useState, useEffect \} from 'react'/, "import React, { useState, useEffect, useMemo } from 'react'");

fs.writeFileSync('apps/web/src/services/imageOptimization.tsx', code);
