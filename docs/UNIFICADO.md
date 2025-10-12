# San Juan Ultimate Crew — Guía Unificada (11-Oct-2025)

Esta guía reúne y normaliza la información de todos los documentos .txt originales (Eventos, Finanzas, Comunicaciones, Roster, Lesiones, Recursos, Rivales, Jugadas, Estadísticas, etc.), más el estado actual de implementación en frontend y backend. Incluye enlaces rápidos, flujos, endpoints, y notas de operación en Windows.

## Tabla de contenidos

- Introducción y Alcance
- Módulos y Funcionalidad
  - Dashboard
  - Roster y Roster Torneo
  - Eventos y Calendario
  - Comunicaciones (Canales y Mensajes)
  - Finanzas
  - Lesiones
  - Rivales
  - Jugadas
  - Centro de Recursos
  - Estadísticas
  - Medios (pendiente)
  - Reserva (pendiente)
- API: Endpoints y Contratos
- Frontend: Rutas y UX claves
- Datos y Base de Datos (Prisma)
- Pruebas y Calidad (API + E2E)
- Operación en Windows (PowerShell)
- Roadmap y Próximos Pasos

---

## Introducción y Alcance

El objetivo es gestionar el equipo “San Juan Ultimate Crew” con una plataforma full‑stack: React (Vite) + Tailwind en el frontend y Express + Prisma + PostgreSQL en el backend. Los documentos .txt se usaron como prototipos y se consolidaron en módulos reales con filtros, paginación, exportaciones y autenticación opcional (JWT con toggle AUTH_REQUIRED).

## Módulos y Funcionalidad

- Dashboard
  - Accesos rápidos y KPIs iniciales. Integra resúmenes de eventos, asistencia y cifras de finanzas.
  - Estado: Implementado.

- Roster (+ Roster Torneo)
  - Roster: gestión de jugadores con filtros por posición/estado y búsqueda.
  - Roster Torneo: selección por evento (agregar/quitar, roles, estado) y exportación CSV.
  - Estado: Implementado.

- Eventos y Calendario
  - CRUD de eventos (entrenamientos, torneos, sociales), asistencia, vista lista y calendario (básica).
  - Estado: Implementado (calendario avanzado: parcial).

- Comunicaciones
  - Canales y mensajes por evento o libres; polling con since y paginado; copiar enlace.
  - Estado: Implementado.

- Finanzas
  - Cuentas, categorías, transacciones, resumen global y exportación.
  - Estado: Implementado.

- Lesiones
  - Registro y seguimiento por severidad/estado; filtros y exportación.
  - Estado: Implementado.

- Rivales
  - Scouting, filtros y CSV; base de datos inicial con ejemplos.
  - Estado: Implementado.

- Jugadas
  - Biblioteca filtrable por categoría y búsqueda; preview y exportación CSV.
  - Estado: Implementado.

- Centro de Recursos
  - Listado, filtros, orden, subida (10 MB, PDF/PNG/JPG/GIF/TXT), preview, edición inline y borrado múltiple.
  - Estado: Implementado.

- Estadísticas
  - KPIs agregados y resúmenes; comparativas avanzadas futuras.
  - Estado: Implementado (comparativas avanzadas: parcial).

- Medios (pendiente)
  - Planner de contenidos y KPIs sociales.

- Reserva (pendiente)
  - Definir alcance (instalaciones vs. suplentes/rotaciones).

## API: Endpoints y Contratos

- Health: GET /health, GET /health/db
- Players: GET/POST /api/players, PUT/DELETE /api/players/:id
- Events: GET/POST /api/events, PUT/DELETE /api/events/:id
- Attendance: GET/POST/PUT/DELETE /api/attendance
- Channels: GET /api/channels?eventId=, GET /api/channels/:id, POST /api/channels
- Messages: GET /api/messages?channelId=&limit=&before=&since=, POST /api/messages
- Finanzas:
  - Accounts: GET/POST/DELETE /api/accounts[/:id]
  - Categories: GET/POST/DELETE /api/categories[/:id]
  - Transactions: GET/POST/PUT/DELETE /api/transactions[/:id]
  - Summary: GET /api/transactions/summary/overall
- Event Participants: GET /api/event-participants?eventId=, PUT /api/event-participants, DELETE /api/event-participants?eventId=&playerId=
- Resources: GET /api/resources[?q&category], GET /api/resources/paged, GET /api/resources/categories, GET /api/resources/export, POST /api/resources, PUT /api/resources/:id, DELETE /api/resources/:id, POST /api/resources/bulk-delete, POST /api/resources/upload (multipart/form-data)
- Rivals: CRUD
- Plays: CRUD (filtros q/category/limit/offset)
- Injuries: CRUD (filtros playerId/severity/status)
- Stats: GET /api/stats
- Auth (si AUTH_REQUIRED=true): POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me

Notas:
- En recursos, DELETE borra también archivos físicos asociados.
- CSV de recursos incluye BOM UTF‑8 para Excel.

## Frontend: Rutas y UX claves

- /login: autenticación y almacenamiento del token (localStorage) cuando AUTH está activo.
- /, /roster, /roster-torneo, /eventos, /comunicacion, /finanzas, /estadisticas, /lesiones, /rivales, /jugadas, /recursos
- URL‑sync extensivo: filtros reflejados en la URL y persistencia de tamaño de página en localStorage en módulos con paginación.
- ConfirmModal accesible y con testIDs; toasts globales para feedback consistente.

## Datos y Base de Datos (Prisma)

- PostgreSQL (Docker). Migraciones/seed y onDelete bien definidos para cleanup estable.
- Subidas en apps/api/uploads expuestas en /uploads.

## Pruebas y Calidad (API + E2E)

- API (Vitest): health, players, resources+upload, finances paginado y summary, event-participants.
- E2E (Playwright): orquestación automática (API+web), globalSetup con health/seed, autenticación por API y selectores robustos. CI actualizado.
  - Optimización: el globalSetup genera storageState en `apps/web/tests/.auth/{admin,guest}.json` para acelerar sesiones autenticadas. Los tests siguen siendo compatibles sin depender de estos archivos.
  - Proyectos opcionales: se habilitan proyectos Playwright pre-autenticados (admin/guest) sólo si `PW_AUTH_PROJECTS=1`.
  - Tareas VS Code útiles:
    - "Web: test:e2e (BASE_URL=5173)" → corre E2E normal.
    - "Web: test:e2e (auth projects)" → setea `PW_AUTH_PROJECTS=1` y corre los proyectos adicionalmente.
    - "Web: test:e2e (admin project only)" → ejecuta sólo el proyecto admin con storageState.
  - Reportes y trazas:
    - Local: tras ejecutar E2E, abre el reporte HTML con `npm -w apps/web run test:e2e:report` o la tarea "Web: open E2E report". Carpeta: `apps/web/playwright-report/`.
    - CI: los artifacts `playwright-report*` y `playwright-test-results*` (trazas/screenshots/videos) quedan adjuntos al run del workflow por 7 días.

## Operación en Windows (PowerShell)

- Docker compose up -d
- npm -w apps/api run prisma:generate; npm -w apps/api run prisma:migrate; npm -w apps/api run prisma:seed
- npm run dev (levanta API+Web) o npm -w apps/web run test:e2e
- VITE_API_URL en apps/web/.env.local apunta a http://localhost:4000

## Roadmap y Próximos Pasos

- Autenticación endurecida (cookies httpOnly, refresh), RBAC completo, rate limiting.
- Mejoras de UX (calendario avanzado, comparativas estadísticas).
- Integración de Medios y definición de Reserva.
- Ampliar cobertura de tests Web.
