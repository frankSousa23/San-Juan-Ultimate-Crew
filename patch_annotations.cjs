const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/Annotations.tsx', 'utf8');

const regex = /(const canManage = \(\(\) => \{[\s\S]*?\}\)\(\))([\s\S]*?)(const \[selectedEvent, setSelectedEvent\] = useState<EventItem \| null>\(null\))/;
code = code.replace(regex, '$3\n$2$1');

fs.writeFileSync('apps/web/src/pages/Annotations.tsx', code);
