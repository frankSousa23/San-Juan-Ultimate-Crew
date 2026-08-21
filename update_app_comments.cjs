const fs = require('fs');
let code = fs.readFileSync('apps/web/src/App.tsx', 'utf8');

// Updating comments in App.tsx to reflect the current multi-team setup and new roles
code = code.replace(
  /\/\/ Protected Route Component/,
  '// Protected Route Component - Maneja la protección de rutas basada en roles y la inyección de contexto Multi-Equipo'
);

code = code.replace(
  /\/\/ Player, Captain, Coach, Directiva, Annotator & Admin Routes/,
  '// Rutas principales del Equipo (Aisladas por teamId) - Jugadores, Capitanes, Entrenadores, Directiva'
);

fs.writeFileSync('apps/web/src/App.tsx', code);
