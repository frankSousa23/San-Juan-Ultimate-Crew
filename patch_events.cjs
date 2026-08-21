const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/Events.tsx', 'utf8');

code = code.replace(/    FOUL: 'Falta',\n    TIMEOUT: 'Tiempo muerto',\n    SUBSTITUTION: 'Sustitución',\n    INJURY: 'Lesión',\n    GENERAL: 'General',\n    STRATEGY: 'Estrategia',\n    PERFORMANCE: 'Rendimiento',\n/g, '');

code = code.replace(/    FOUL: 'bg-yellow-100 text-yellow-800',\n    TIMEOUT: 'bg-gray-100 text-gray-800',\n    SUBSTITUTION: 'bg-indigo-100 text-indigo-800',\n    INJURY: 'bg-red-200 text-red-900',\n    GENERAL: 'bg-gray-100 text-gray-800',\n    STRATEGY: 'bg-teal-100 text-teal-800',\n    PERFORMANCE: 'bg-amber-100 text-amber-800',\n/g, '');

fs.writeFileSync('apps/web/src/pages/Events.tsx', code);
