# 🧪 Testing en SIGEDIVO

El sistema de gestión y rendimiento deportivo SIGEDIVO incorpora una estrategia de testing y calidad rigurosa para garantizar la estabilidad tanto en la experiencia del usuario (frontend) como en el procesamiento de los datos (backend).

## Enfoque de Pruebas

1. **Typing Estricto y Análisis Estático:** Todo el código TypeScript se valida usando un linter configurado (\`eslint\`) y el compilador de TypeScript (\`tsc\`), evitando fallos en tiempo de ejecución por disparidad de datos o estructuras.
2. **Construcción Predictiva:** Antes del despliegue, todo el sistema pasa por un proceso de \`build\` con Vite, minificando los componentes y comprobando problemas de inyección o referencias caídas.
3. **Multi-Equipo en cuenta:** Todo el flujo de validación de APIs, linter y tests debe tomar en cuenta el pilar principal de la arquitectura: el aislamiento por \`teamId\`.
4. **End-to-End (E2E):** Para asegurar los flujos críticos (Login, Manejo de Equipos, Registro de Anotaciones), se usa \`Playwright\` (\`npm run test:e2e\`).

## Cómo Ejecutar las Pruebas

\`\`\`bash
# Ejecutar validaciones estáticas (ESLint y Prettier)
npm run lint

# Verificar compilación completa
npm run build

# Ejecutar Test E2E de Playwright (Frontend & Backend integration)
npm run test:e2e
\`\`\`
