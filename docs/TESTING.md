# 🧪 Estrategia y Guía Oficial de Testing en SIGEDIVO

El **Sistema de Gestión para el Disco Volador (SIGEDIVO)** incorpora una estrategia rigurosa de control de calidad, aseguramiento y testing continuo tanto en el frontend como en el backend, garantizando estabilidad operativa durante torneos y partidos oficiales.

---

## 🎯 1. Pirámide de Calidad y Enfoque de Pruebas

```
                  ┌──────────────────────────────┐
                  │    Pruebas End-to-End (E2E)  │  <- Playwright (Desktop & Mobile)
                  │   Flujos Críticos de Torneo  │
                  ├──────────────────────────────┤
                  │ Pruebas Unitarias / API Rest │  <- Vitest & Supertest
                  │ Scoping Multi-Equipo & RBAC  │
                  ├──────────────────────────────┤
                  │  Análisis Estático & Tipado  │  <- TypeScript (Strict) + ESLint
                  │  Compilación Bundle (Vite)   │
                  └──────────────────────────────┘
```

1. **Tipado Estricto (TypeScript Strict):** Todo el código cliente y servidor está estrictamente tipado. No se permiten tipos `any` implícitos ni disparidades estructurales.
2. **Aislamiento Multi-Equipo (`teamId`):** Todas las consultas, transacciones y esquemas Zod se prueban para verificar que los datos pertenezcan única y exclusivamente al contexto del equipo activo.
3. **Control de Acceso RBAC:** Validación automatizada de permisos para los 7 roles del sistema (`admin`, `directiva`, `captain`, `coach`, `treasurer`, `annotator`, `player`, `guest`).
4. **Marcador Táctil y Anotaciones en Vivo:** Validación de registro rápido de goles, asistencias, bloqueos (D), pérdidas de posesión y rubricación SOTG sin pérdidas de estado.
5. **Generadores de Documentación y PDFs:** Verificación de generación de PDFs interactivos y descargables (`jsPDF`) sin roturas de página ni desbordamientos de texto.

---

## 🚀 2. Comandos de Ejecución de Pruebas

### 🔍 A. Análisis Estático y Linter
```bash
# Validar reglas de estilo, tipado y sintaxis en todo el proyecto
npm run lint

# Formatear archivos con Prettier
npm -w apps/web run format
```

### 📦 B. Verificación de Compilación de Producción
```bash
# Compilar aplicación cliente (Vite) y servidor (esbuild)
npm run build
```

### 🎭 C. Pruebas End-to-End (Playwright)
```bash
# Ejecutar todas las pruebas E2E en modo headless
npm -w apps/web run test:e2e

# Abrir el reporte gráfico interactivo de Playwright
npm -w apps/web run test:e2e:report
```

---

## 📋 3. Escenarios Críticos Validados

| Módulo | Escenario de Prueba | Criterio de Éxito |
| :--- | :--- | :--- |
| **Autenticación** | Registro de nuevo atleta en `/register` | Usuario inicia en estado `PENDING` y no accede a rutas privadas. |
| **Aprobación Admin** | Super Admin aprueba cuenta en `/admin/usuarios` | El usuario pasa a `APPROVED`, se le asigna rol y equipo, y puede iniciar sesión. |
| **Roster & Dorsales** | Asignación de dorsal 1-99 en equipo Open y Femenino | Los dorsales coexisten sin conflicto gracias al índice compuesto `(teamId, number)`. |
| **Partidos en Vivo** | Registro de gol con asistente en `/eventos/:id/anotaciones` | Se actualiza el marcador en vivo y se incrementa el acumulador de `PlayerMatchStats`. |
| **Espíritu de Juego** | Evaluación SOTG de 5 criterios WFDF (0-4 pts) | Cálculo correcto del total sobre 20 puntos con almacenamiento inmutable. |
| **PDFs y Manual** | Descarga de manual oficial y guías técnicas en `/recursos` | Generación limpia de PDF sin desbordamientos de márgenes ni páginas en blanco. |

---

## 🛡️ 4. Integración Continua (CI/CD)

En cada *Pull Request* o *Push* a la rama principal, GitHub Actions ejecuta el pipeline automatizado:
1. `npm install` (Instalación limpia de dependencias).
2. `npm run lint` (Análisis estático de TypeScript y ESLint).
3. `npm run build` (Compilación completa de frontend y backend).
4. `npm -w apps/web run test:e2e` (Pruebas E2E automatizadas).
