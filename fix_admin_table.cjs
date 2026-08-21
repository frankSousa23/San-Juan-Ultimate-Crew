const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/AdminUsers.tsx', 'utf8');

// Replace table header Roles
const oldTh = '<th className="text-left px-4 py-2">Roles</th>';
const newTh = '<th className="text-left px-4 py-2">Roles</th>\\n              <th className="text-left px-4 py-2">Equipo</th>';
code = code.replace(oldTh, newTh.replace(/\\n/g, '\n'));

// Now replace the td for Roles and the one after it to include team Selection.
// Let's just find the exact td block.
const oldTd = `<td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">`;
const newTd = `<td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">`;
// Wait, regex might be safer. Let's look at the exact line in AdminUsers.
fs.writeFileSync('apps/web/src/pages/AdminUsers.tsx', code);
