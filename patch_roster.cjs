const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/Roster.tsx', 'utf8');

code = code.replace(/onSubmit=\{\(data\) => createPlayer\(data as any\)\}/g, 'onSubmit={async (data) => { await createPlayer(data as any) }}');
code = code.replace(/onSubmit=\{\(data\) => selected && updatePlayer\(selected\.id, data as any\)\}/g, 'onSubmit={async (data) => { if (selected) await updatePlayer(selected.id, data as any) }}');

fs.writeFileSync('apps/web/src/pages/Roster.tsx', code);
