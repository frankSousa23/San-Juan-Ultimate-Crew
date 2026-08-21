const fs = require('fs');
let code = fs.readFileSync('apps/web/src/features/profile/components/ProfileOverview.tsx', 'utf8');

code = code.replace(/toasts\.success\(/g, 'alert(');
code = code.replace(/toasts\.error\(/g, 'alert(');
code = code.replace(/const updated = await usersApi\.togglePlayerRole\(newState\)/g, 'const updated = await handleTogglePlayerRole(newState) as any');
code = code.replace(/await refreshUser\(\)/g, '// await refreshUser()');

fs.writeFileSync('apps/web/src/features/profile/components/ProfileOverview.tsx', code);
