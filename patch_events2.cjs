const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/Events.tsx', 'utf8');

code = code.replace(/updateEvent=\{updateEvent\}/, 'updateEvent={async (id, data) => { await updateEvent(id, data) }}');
code = code.replace(/createEvent=\{createEvent\}/, 'createEvent={async (data) => { await createEvent(data) }}');

fs.writeFileSync('apps/web/src/pages/Events.tsx', code);
