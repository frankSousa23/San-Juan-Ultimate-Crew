# San Juan Ultimate Crew — Resumen Completo (11-Oct-2025)

Este documento consolida el estado actual del proyecto, separando frontend y backend, describiendo el ciclo del sistema, conexiones entre rutas, nivel de seguridad y próximos pasos recomendados (autenticación, roles/permisos y hardening). También incluye el estado verificado de build/tests.

## Backend (apps/api)

- Stack
  - Node.js + Express + TypeScript (ESM), Prisma ORM con PostgreSQL.
  - Middlewares: helmet (seguridad), cors (orígenes por env), morgan (logs), express.json().
  - dotenv para configuración; estáticos de uploads en `/uploads`.
  - Validación con Zod en varios routers.

- Routers y endpoints
  - Salud
    - GET `/health` → { ok, time }
    - GET `/health/db` → { ok, players, events } (500 si DB falla)
  - Players: `GET/POST /api/players`, `PUT/DELETE /api/players/:id`
  - Events: `GET/POST /api/events`, `PUT/DELETE /api/events/:id`
    - Attendance: `/api/attendance` (marcado de asistencia por evento)
  - Communications
    - Channels: `GET /api/channels?eventId=`, `GET /api/channels/:id`, `POST /api/channels`
    - Messages: `GET /api/messages?channelId=&limit=&before=&since=`, `POST /api/messages`
  - Finanzas
    - Accounts: `GET/POST/DELETE /api/accounts[/:id]`
    - Categories: `GET/POST/DELETE /api/categories[/:id]`
    - Transactions: `GET/POST/PUT/DELETE /api/transactions[/:id]`
    - Summary: `GET /api/transactions/summary/overall` → { income, expense, balance }
  - Event Participants (Roster Torneo)
    - `GET /api/event-participants?eventId=`
    - `PUT /api/event-participants { eventId, playerId, role?, status? }`
    - `DELETE /api/event-participants?eventId=&playerId=`
  - Recursos (Centro de Recursos)
    - `GET /api/resources?q=&category=`
    - `GET /api/resources/paged?q=&category=&limit=&offset=&order=` (order: `createdAtDesc`|`titleAsc`)
    - `GET /api/resources/categories`
    - `GET /api/resources/export?...` (CSV con BOM)
    - `POST /api/resources`
    - `PUT /api/resources/:id`
    - `DELETE /api/resources/:id` (borra archivo físico si existía)
    - `POST /api/resources/bulk-delete { ids:number[] }`
    - Upload: `POST /api/resources/upload` (multipart/form-data)
  - Rivals: CRUD y filtros
  - Plays (Jugadas): `GET /api/plays?q=&category=&limit=&offset=`, CRUD
  - Injuries (Lesiones): CRUD/filtros
  - Stats: `GET /api/stats` → totales, próximos eventos, asistencia por estado, eventos por tipo

- Ficheros clave
  - `apps/api/src/app.ts` monta routers, `/uploads` estáticos, y raíz `/` JSON.
  - `apps/api/src/index.ts` levanta el server (PORT=4000 por defecto).
  - `apps/api/uploads` almacén de ficheros subidos.
  - Scripts: `scripts/wait-health.cjs`, `scripts/smoke-e2e.cjs` (+ TS/JS variantes).

- Tests (Vitest)
  - `src/app.test.ts`: root y health
  - `src/players.test.ts`: CRUD Players
  - `src/resources.test.ts`: CRUD + upload
  - `src/finances.test.ts`: listado paginado + summary overall
  - `src/eventParticipants.test.ts`: list/upsert/delete

- Datos/DB
  - PostgreSQL via Docker Compose (postgres:16, 5432).
  - Prisma migrations/seed; Prisma Client generado.

- Seguridad actual
  - Helmet, CORS por env, validación Zod parcial, multer con restricciones y limpieza de archivos.
  - Faltantes: sin auth/z (roles/permisos), sin rate limiting, CORS puede ser laxo en dev, sin auditoría.

## Frontend (apps/web)

- Stack
  - Vite + React + TypeScript + Tailwind; React Router; Axios (baseURL VITE_API_URL o http://localhost:4000).
  - Componentes comunes: Layout, Toast, ConfirmModal.

- Rutas y páginas
  - `/` Dashboard
  - `/roster` Roster Principal
    - URL-sync: `q`, `pos` (HANDLER/CUTTER/HYBRID), `st` (ACTIVE/INJURED/INACTIVE)
    - UX: Enter aplica, Escape limpia q; CRUD jugadores.
  - `/eventos` Eventos
    - URL-sync: `tab`, `type`, `status`, `q`, `limit`, `page`; page-size persistido en localStorage.
    - Gestión de eventos y asistencia; crear canal desde evento.
  - `/comunicacion` Comunicaciones
    - URL-sync: `channelId`; botón “Copiar enlace”. Polling `since` y paginado de mensajes.
  - `/finanzas` Finanzas
    - URL-sync: `from`, `to`, `type`, `accountId`, `categoryId`, `limit`, `page`; page-size persistente.
    - CRUD de cuentas/categorías/transacciones; CSV (cliente) y summary.
  - `/estadisticas` Estadísticas → consume `/api/stats`.
  - `/lesiones` Lesiones → URL-sync (`playerId`, `severity`, `status`, `limit`).
  - `/rivales` Rivales → URL-sync (`q`, `limit`, `page`); CSV; CRUD.
  - `/jugadas` Jugadas → URL-sync (`q`, `category`, `limit`); CSV; CRUD.
  - `/roster-torneo` Roster por evento
    - URL-sync: `eventId`, `q`, `pos`, `status`, `sort`; `eventId` persiste en localStorage.
    - Banner del evento; “Copiar enlace”; bulk add/remove; edición inline; CSV por evento.
  - `/recursos` Centro de Recursos
    - URL-sync: `q`, `category`, `order`, `limit` (persistencia de page-size).
    - Paginación server-side; CSV (servidor); upload; edición inline; borrado múltiple; preview; datalist de categorías; toasts/errores.

- UX común
  - Toasts, banners de error con Reintentar/Ocultar, confirmaciones de borrado, “Copiar enlace”.

## Ciclo del sistema y conexiones

- SPA (React) → Axios (`apps/web/src/lib/api.ts`) → Express → Prisma → PostgreSQL.
- Subidas a `/api/resources/upload` guardan en `apps/api/uploads` y se exponen en `/uploads/...`.
- CSV: algunos generados cliente (junta páginas) y Recursos exportado por servidor con BOM.
- Integraciones: Eventos↔Comunicaciones (canal por evento); Roster Torneo↔Event Participants.

## Estado verificado (11-Oct-2025)

- Web build: PASS (Vite build ok).
- Prisma generate/migrate: PASS.
- API tests (Vitest): PASS (5 archivos, 17 tests).
- VS Code tasks: limpias y ampliadas; añadida "Dev: start stack (db+api+wait+web)".

## Nivel de seguridad actual

- Positivo: helmet, CORS configurable, validación Zod en varios routers, multer con MIME/size, borrado físico de archivos.
- Faltantes: no hay autenticación ni autorización; sin rate limiting; CORS no restringido en prod; validación no homogénea; sin auditoría.

## Roadmap recomendado (autenticación y hardening)

1. Autenticación (JWT con cookies httpOnly) y sesiones
   - Endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`.
   - Hash de contraseñas (bcrypt/argon2); cookies Secure + SameSite en producción; CORS cerrado.
2. Autorización (RBAC)
   - Modelos: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`.
   - Middleware `requireAuth` y `requireRole(['admin', ...])`; proteger Finanzas, Recursos (upload/bulk), Roster Torneo.
3. Hardening
   - Rate limiting (global y por ruta crítica), Zod en todos los routers, logging estructurado, auditoría de cambios.
4. Uploads
   - Mover a S3/Cloud Storage con presigned URLs; antivirus opcional; cuotas por usuario.
5. Calidad y CI
   - ESLint/Prettier en CI, cobertura de tests ampliada (Comunicaciones, Rivals, Plays, Injuries), smoke e2e web (Playwright) para flujos clave.

---

Para detalles operativos (scripts, tareas de VS Code, troubleshooting), consulta el README principal.