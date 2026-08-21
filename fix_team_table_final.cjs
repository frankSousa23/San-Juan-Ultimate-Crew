const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/AdminUsers.tsx', 'utf8');

// I also need to ensure the empty row span is updated from 7 to 8 to match the column count if it's there
code = code.replace(/colSpan=\{7\}/g, 'colSpan={8}');
// Actually the "Todos los usuarios" table has Email, Nombre, Estado, Roles, Equipo, PlayerId, Action = 7 cols.
// Let's not blindly replace colSpan.
