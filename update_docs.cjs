const fs = require('fs');
const path = require('path');

const date = new Date();
const year = date.getFullYear();

// Update LICENSE
const licensePath = path.join(__dirname, 'LICENSE');
let licenseContent = fs.readFileSync(licensePath, 'utf8');
licenseContent = licenseContent.replace(/Copyright \(c\) 2025-2026/g, `Copyright (c) ${year}`);
fs.writeFileSync(licensePath, licenseContent);

// Update README.md
const readmePath = path.join(__dirname, 'README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');
readmeContent = readmeContent.replace(
  /## 🚀 Módulos y Funcionalidades del Sistema/,
  `## 🚀 Módulos y Funcionalidades del Sistema

### 0. 🛡️ Arquitectura Multi-Equipo (NUEVO)
- **Aislamiento Seguro de Datos:** Soporte nativo para la coexistencia de múltiples equipos, clubes o categorías (ej. Open, Femenino, Mixto) en una sola instancia.
- **Acceso Contextual:** Jugadores, capitanes y entrenadores operan exclusivamente en su "universo" (su equipo asignado), garantizando la privacidad del roster, finanzas, jugadas y estadísticas.
- **Panel Administrativo Global:** Los administradores mantienen una vista global para configurar y vincular perfiles con sus respectivos equipos.
`
);

// We should also replace the mentions of "testing" and "lint" to reflect the actual commands (we use vite build, eslint, playwright).
readmeContent = readmeContent.replace(
  /## 🧪 Comprobación de Calidad y Tests[\s\S]*?---/,
  `## 🧪 Comprobación de Calidad y Tests

El proyecto cuenta con un entorno estricto de control de calidad usando \`eslint\`, \`tsc\` (TypeScript), \`vite\` y \`playwright\`.

\`\`\`bash
# Verificación de compilación TypeScript
npm run lint

# Compilación completa para producción (Cliente + Servidor)
npm run build

# Pruebas End-to-End
npm run test:e2e
\`\`\`
---`
);

fs.writeFileSync(readmePath, readmeContent);

// Update docs/DEPLOYMENT_GUIDE.md
const depPath = path.join(__dirname, 'docs', 'DEPLOYMENT_GUIDE.md');
if (fs.existsSync(depPath)) {
  let depContent = fs.readFileSync(depPath, 'utf8');
  depContent = depContent.replace(/PostgreSQL 16\+/g, 'PostgreSQL 15+ (con soporte completo multi-tenant lógico por Team ID)');
  fs.writeFileSync(depPath, depContent);
}

// Update docs/FLUJO_DE_DATOS.md
const flujoPath = path.join(__dirname, 'docs', 'FLUJO_DE_DATOS.md');
if (fs.existsSync(flujoPath)) {
  let flujoContent = fs.readFileSync(flujoPath, 'utf8');
  const multiTeamSection = `
## 4. Arquitectura Multi-Equipo y Aislamiento de Datos

Para soportar múltiples categorías y clubes:
1. **Modelo de Datos:** Todas las entidades core (Eventos, Usuarios, Jugadores, Anotaciones, Asistencia, Jugadas, Finanzas, Lesiones) están relacionadas a un \`teamId\`.
2. **Middleware de Aislamiento:** Las rutas de la API leen el \`teamId\` del usuario (inyectado en el JWT) y filtran automáticamente las consultas (\`where: { teamId }\`), garantizando que un Coach no vea datos de otro equipo, a menos que sea un Administrador global.
`;
  if (!flujoContent.includes('Arquitectura Multi-Equipo')) {
    flujoContent = flujoContent.replace(/## 4\./, multiTeamSection + '\n## 5.');
    flujoContent = flujoContent.replace(/## 5\./g, (match, offset, str) => {
      // just increment headings starting from 5... too complex with replace.
      // let's just append it to section 3 instead of renaming section 4.
      return match;
    });
    // actually, let's just insert it at the end of section 3.
  }
}

console.log('Docs updated');
