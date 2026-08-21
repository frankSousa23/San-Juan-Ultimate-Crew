const fs = require('fs');
const path = require('path');

// Update docs/FLUJO_DE_DATOS.md
const flujoPath = path.join(__dirname, 'docs', 'FLUJO_DE_DATOS.md');
if (fs.existsSync(flujoPath)) {
  let flujoContent = fs.readFileSync(flujoPath, 'utf8');
  const multiTeamSection = `

### Arquitectura Multi-Equipo y Aislamiento de Datos

Para soportar múltiples categorías y clubes en la actualidad:
1. **Modelo de Datos Multi-Tenant:** Todas las entidades core del sistema (Eventos, Usuarios, Jugadores, Anotaciones, Asistencia, Jugadas, Finanzas, Lesiones) están estrictamente relacionadas a un \`teamId\`.
2. **Middleware de Aislamiento Activo:** Las rutas de la API decodifican el \`teamId\` del usuario (inyectado de forma segura en el JWT) y filtran automáticamente las consultas (\`where: { teamId }\`), garantizando por defecto que un Coach o Capitán no pueda consultar, modificar ni listar datos pertenecientes a otro equipo o categoría, a menos que cuente con permisos de Administrador global.
`;
  if (!flujoContent.includes('Arquitectura Multi-Equipo y Aislamiento')) {
    flujoContent = flujoContent.replace(/## 3\. [\s\S]*?(?=## 4\.)/, (match) => {
      return match + multiTeamSection;
    });
    fs.writeFileSync(flujoPath, flujoContent);
  }
}

// Update docs/WORKFLOW_DE_PRUEBAS.md
const testingPath = path.join(__dirname, 'docs', 'WORKFLOW_DE_PRUEBAS.md');
if (fs.existsSync(testingPath)) {
  let content = fs.readFileSync(testingPath, 'utf8');
  content = content.replace(/Vitest/gi, 'Playwright y validaciones TypeScript');
  content = content.replace(/Pruebas Unitarias \(Backend & Frontend\)/, 'Pruebas E2E, TypeScript Strict y Linter Automático');
  fs.writeFileSync(testingPath, content);
}
console.log('Docs 2 updated');
