# 🧪 Estrategia y Guía Oficial de Testing en SIGEDIVO

El **Sistema de Gestión para el Disco Volador (SIGEDIVO)** incorpora una estrategia integral de control de calidad, aseguramiento continuo y pruebas de extremo a extremo (E2E) directamente contra entornos de producción, garantizando estabilidad operativa durante torneos y partidos oficiales en campo deportivo.

---

## 🎯 1. Pirámide de Calidad y Enfoque de Pruebas

```
                  ┌──────────────────────────────┐
                  │ Ultra-Suite E2E en Producción│  <- 34/34 PASS (Live Deploy Test Runner)
                  │ 50 Reads + 20 Writes Stress  │  <- Benchmark de Carga Concurrente
                  ├──────────────────────────────┤
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
3. **Control de Acceso RBAC Granular:** Validación automatizada de permisos para los 9 roles del sistema (`admin`, `directiva`, `captain`, `coach`, `annotator`, `treasurer`, `marketing`, `player`, `guest`).
4. **Formularios de Eventos y Protección Modal:** Verificación de presets rápidos de torneos/caimaneras, cálculo horario y validación de seguridad contra clics accidentales en el fondo.
5. **Marcador Táctil y Anotaciones en Vivo:** Validación de registro rápido de goles, asistencias, bloqueos (D), pérdidas de posesión y rubricación SOTG sin pérdidas de estado.
6. **Mesa Técnica y Control de Partido:** Bloqueo de anotadores oficiales, relevo en caliente de anotadores (*shift handover*) y actas protegidas.
7. **Motor Financiero y Tesorería:** Validación de transacciones de ingreso/egreso, balance neto consolidado y restricción RBAC para no tesoreros (403 Forbidden).
8. **Seguimiento Médico de Lesiones:** Transición de estados `MILD` / `MODERATE` / `SEVERE` y ciclo de alta médica `ACTIVE` -> `RESOLVED`.
9. **Benchmark de Carga y Concurrencia Extrema:** Ráfagas de 50 lecturas concurrentes simultáneas y 20 escrituras atómicas en paralelo con 0% de pérdidas de datos.

---

## 🚀 2. Comandos de Ejecución de Pruebas

### 🏆 A. Ultra-Suite E2E y Stress Benchmark contra Producción
```bash
# Ejecutar los 34 casos de prueba automatizados y el benchmark de concurrencia
npx tsx scripts/run-live-deploy-tests.ts
```

### 🔍 B. Análisis Estático y Linter
```bash
# Validar reglas de estilo, tipado y sintaxis en todo el proyecto
npm run lint

# Formatear archivos con Prettier
npm -w apps/web run format
```

### 📦 C. Verificación de Compilación de Producción
```bash
# Compilar aplicación cliente (Vite) y servidor (esbuild)
npm run build
```

### 🧪 D. Pruebas Unitarias y de Integración API (Vitest)
```bash
# Ejecutar suite completa de pruebas API
npm run test:api

# Ejecutar pruebas con verificación de autenticación obligatoria
npm --workspace apps/api run test:all:auth
```

### 🎭 E. Pruebas End-to-End con Navegador (Playwright)
```bash
# Ejecutar todas las pruebas E2E en modo headless
npm -w apps/web run test:e2e

# Abrir el reporte gráfico interactivo de Playwright
npm -w apps/web run test:e2e:report
```

---

## 📋 3. Matriz de Fases de la Ultra-Suite E2E (34 Casos)

| Fase | Título del Módulo | Casos de Prueba Incluidos |
| :---: | :--- | :--- |
| **1** | **Health Check & Admin Auth** | 1.1 Health Check API (200 OK)<br>1.2 Login Admin Principal (JWT)<br>1.3 Consulta de Equipos Base y Asignación de Dorsales Libres |
| **2** | **Registro & Aprobación RBAC** | 2.1 Registro Concurrente de 6 Cuentas<br>2.2 Aprobación Administrativa de Roles<br>2.3 Generación de Sesiones JWT Paralelas |
| **3** | **Roster & Dorsales Únicos** | 3.1 Creación de Atletas en Equipo A<br>3.2 Validación de Rechazo de Dorsal Duplicado (409)<br>3.3 Permitir Mismo Dorsal en Equipo Distinto<br>3.4 Aislamiento de Roster y Seguridad RBAC (403) |
| **4** | **Torneo & Convocatorias** | 4.1 Creación de Torneo Padre y Partido Hijo<br>4.2 Convocatoria Táctica a O-Line, D-Line y Refuerzo |
| **5** | **Mesa Técnica en Vivo** | 5.1 Registro de Gol con Asistencia y Defensa Callahan<br>5.2 Consulta de Estadísticas Agregadas del Partido |
| **6** | **Recursos Multimedia & Chat** | 6.1 Publicación de Reglamento WFDF y Búsqueda por Tags<br>6.2 Mensajería en Vivo en Canal de Evento |
| **7** | **SOTG WFDF & Batch Fixtures** | 7.1 Consulta de Standings y Leaderboards de Torneo<br>7.2 Programación en Lote de Semifinales y Gran Final |
| **8** | **Finanzas & Tesorería** | 8.1 Creación de Cuentas Contables y Categorías<br>8.2 Registro de Ingresos (+$500) y Egresos (-$150)<br>8.3 Verificación de Balance Neto y Bloqueo RBAC a Atletas (403) |
| **9** | **Control Médico & Lesiones** | 9.1 Registro de Lesión MODERATE/ACTIVE<br>9.2 Evolución Médica y Alta (RESOLVED) |
| **10** | **Scouting Rivales & Playbook** | 10.1 Creación de Club Rival y Ficha de Atleta Oponente<br>10.2 Anotación de Gol Rival en Partido Oficial<br>10.3 Creación y Búsqueda de Jugadas Ofensivas (Plays) |
| **11** | **Comunidad, Relevos & Asistencia** | 11.1 Noticia Oficial Fijada, Comentarios y Bloqueo<br>11.2 Relevo en Caliente de Anotador (Shift Handover)<br>11.3 Pase de Lista en Cancha (Attendance) |
| **12** | **Seguridad & Auditoría** | 12.1 Enlace Criptográfico de Reseteo de Contraseña (24h)<br>12.2 Envío de Feedback con Rate Limiter<br>12.3 Verificación de Logs de Auditoría |
| **13** | **Benchmark de Concurrencia** | 13.1 Stress Test de 50 Lecturas Simultáneas (p95: 373ms)<br>13.2 Stress Test de 20 Escrituras Atómicas en Ráfaga (0% errores) |

---

## 🛡️ 4. Integración Continua (CI/CD)

En cada *Pull Request* o *Push* a la rama principal `main`, GitHub Actions ejecuta el pipeline automatizado:
1. `npm install` (Instalación limpia de dependencias).
2. `npm run lint` (Análisis estático de TypeScript y ESLint).
3. `npm run build` (Compilación completa de frontend y backend).
4. `npm -w apps/api run test` (Pruebas unitarias de API).
5. `npm -w apps/web run test:e2e` (Pruebas E2E automatizadas).
6. Sincronización y validación de especificaciones OpenSpec (`openspec validate --all`).
