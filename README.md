# San Juan Ultimate Crew

Proyecto full-stack para la gestión del equipo de Ultimate Frisbee.

Tecnologías:

- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Base de Datos: PostgreSQL (con Prisma ORM)

## Requisitos

- Node.js 18+
- Docker (opcional para BD)

## Configuración rápida (Windows PowerShell)

• Copiar variables de entorno (API en 4000 y Web apuntando a esa API):

- Backend: `apps/api/.env.example` -> `apps/api/.env`
- Web: `apps/web/.env.example` -> `apps/web/.env.local`

• Levantar PostgreSQL (con Docker recomendado):

- Ver sección "Base de datos con Docker"

• Instalar dependencias en la raíz (workspaces):

- En PowerShell, si hay restricciones, usa `cmd /c`:

```powershell
cmd /c npm install
```

• Generar Prisma Client (requiere DB accesible):

```powershell
cmd /c npm --workspace apps/api run prisma:generate
```

• Correr en desarrollo (API y Web en paralelo):

```powershell
cmd /c npm run dev
```

## Scripts raíz

- `npm run dev`       Inicia API y Web en paralelo
- `npm run dev:api`   Solo API
- `npm run dev:web`   Solo Web
- `npm run build`     Compila API y Web
- `npm run start`     Ejecuta API compilada
- `node apps/api/scripts/smoke-e2e.cjs`  Ejecuta smoke E2E (CommonJS)

## Base de datos con Docker

Usa PostgreSQL local con Docker (sin campo `version` en docker-compose para evitar warnings):

- Copia `.env.example` a `.env` en `apps/api` y ajusta `DATABASE_URL` si cambias puertos.
- Levanta el contenedor:

```powershell
docker compose up -d
```

- Ejecuta migraciones y carga de datos seed:

```powershell
cmd /c npm --workspace apps/api run prisma:migrate
cmd /c npm --workspace apps/api run prisma:seed
```

## Estructura de carpetas

- `apps/web`  Frontend (React + Vite)
- `apps/api`  Backend (Express + TS + Prisma)

Los prototipos `.txt` de diseño fueron retirados del repositorio. Consulta `docs/DesignMapping.md` para ver el mapeo de esos diseños a las páginas y APIs actuales.

## API Endpoints

- Health: `GET /health`, `GET /health/db`
- Players: `GET/POST /api/players`, `PUT/DELETE /api/players/:id`
- Events: `GET/POST /api/events`, `PUT/DELETE /api/events/:id`
- Channels:
  - `GET /api/channels?eventId=` — lista canales (si `eventId` está presente, filtra por evento); incluye `_count.messages` y último mensaje.
  - `GET /api/channels/:id` — detalle del canal.
  - `POST /api/channels { name, eventId? }` — crea canal.
- Messages:
  - `GET /api/messages?channelId=&limit=30&before=ts&since=ts` — lista de mensajes (orden desc en API).
  - `POST /api/messages { channelId, authorId?, content }` — crea mensaje.

- Event Participants (selección por evento):
  - `GET /api/event-participants?eventId=` — lista participantes por evento (incluye player y event).
  - `PUT /api/event-participants { eventId, playerId, role?, status? }` — crea/actualiza la relación.
  - `DELETE /api/event-participants?eventId=&playerId=` — elimina la relación.
  
  Finanzas (actualizado):
  - Accounts: `GET/POST/DELETE /api/accounts[/:id]`
  - Categories: `GET/POST/DELETE /api/categories[/:id]`
  - Transactions: `GET/POST/PUT/DELETE /api/transactions[/:id]`

- Recursos (Centro de Recursos):
  - `GET /api/resources?q=&category=` — lista recursos, filtro por texto y categoría.
  - `GET /api/resources/categories` — devuelve categorías distintas (no vacías), ordenadas A→Z.
  - `GET /api/resources/paged?q=&category=&limit=&offset=&order=` — listado paginado para ambos órdenes. Param `order`: `createdAtDesc` (por defecto) o `titleAsc`. Límite entre 1 y 200; `offset` ≥ 0.
  - `GET /api/resources/export?q=&category=&order=` — exporta CSV con filtros aplicados. Param `order`: `createdAtDesc` (por defecto) o `titleAsc`. El CSV incluye BOM UTF‑8 para compatibilidad con Excel.
  - `POST /api/resources { title, url, description?, category? }` — crea recurso.
  - `PUT /api/resources/:id { ...partial }` — actualiza campos.
  - `DELETE /api/resources/:id` — elimina recurso.
  - `POST /api/resources/bulk-delete { ids:number[] }` — elimina múltiples recursos y limpia archivos asociados.

## Verificación rápida (smoke tests)

- Preparación:
  - Copia `.env` de ejemplo y levanta Postgres con Docker (si no lo tienes activo):

```powershell
cmd /c copy /Y apps\api\.env.example apps\api\.env
docker compose up -d
cmd /c npm --workspace apps/api run prisma:generate
cmd /c npm --workspace apps/api run prisma:migrate
cmd /c npm --workspace apps/api run prisma:seed
```

- Ejecutar API y Web en dev:

```powershell
cmd /c npm run dev
```

- Probar endpoints clave (API en 4000 por defecto del .env.example) con PowerShell puro:

```powershell
$base = 'http://localhost:4000'
$paths = '/health','/api/players','/api/events','/api/channels','/api/transactions','/api/stats','/api/injuries','/api/rivals','/api/plays'
foreach ($p in $paths) {
  try {
    $null = Invoke-RestMethod -Uri ($base + $p) -TimeoutSec 2
    Write-Host "$p OK"
  } catch {
    Write-Host "$p ERR"
  }
}
```

Resultados esperados: todos en OK. El cleanup del E2E ahora es silencioso (ordenado y tolerante a 404) y no deja residuos.



## Chequeo de flujo completo (E2E) y estabilidad

Este proyecto incluye un smoke E2E que recorre el flujo completo y limpia datos de prueba al final.

1) Health: verifica `/health` hasta que la API esté lista.
2) Players: crea un jugador.
3) Events: crea un evento.
4) Attendance: registra asistencia del jugador al evento.
5) Channels/Messages: crea canal vinculado al evento y publica un mensaje.
6) Finanzas: crea categoría, cuenta y transacción.
7) Rivals/Plays/Injuries: crea un rival, una jugada y una lesión; luego actualiza la lesión.
8) Cleanup: elimina los registros creados para no ensuciar la DB.

Ejecución local (PowerShell o Git Bash):

```powershell
# Asegúrate que la API esté en 4000 (por defecto). En un terminal:
cmd /c npm --workspace apps/api run start

# En otra terminal: correr el smoke E2E (CommonJS)
node apps\api\scripts\smoke-e2e.cjs
```

Salida esperada (resumen):

```text
SMOKE_E2E_SUMMARY
1) /health: 200
2) player: { id, number }
3) event: { id }
4) attendance: { id, status }
5) channel: { id }
6) message: { id }
7) finance: { txn }
8) rival: { id }
9) play: { id }
10) injury: { id, status }
11) injury-update: { id, status }
12) cleanup: OK
```

Notas de estabilidad y solución de problemas:

- Ports: API por defecto en 4000; Web consume `VITE_API_URL` o fallback a 4000.
- Prisma en Windows: si aparece un EPERM sobre `query_engine-windows.dll.node`, eliminar el archivo y regenerar:

```powershell
cmd /c del /F /Q "node_modules\.prisma\client\query_engine-windows.dll.node"
cmd /c npm --workspace apps/api run prisma:generate
```

- Si `docker compose up -d` falla, verifica que Docker Desktop esté abierto y que el puerto 5432 no esté ocupado. Para reiniciar el contenedor:

```powershell
docker compose down ; docker compose up -d
```

- Si la Web no carga datos, confirma que `apps/web/.env.local` tenga `VITE_API_URL=http://localhost:4000` o que la API esté arriba en 4000.

Web preview (opcional):

- Tarea en VS Code: "Web: preview (5176)" lanza vite preview en <http://localhost:5176/> usando Git Bash.
- Manualmente (Git Bash):

```bash
npm -w apps/web run build
npm -w apps/web run preview -- --port 5176 --strictPort
```

Validado: 11-Oct-2025

- Docker: si cambias puertos de Postgres, actualiza `DATABASE_URL` en `apps/api/.env`.

## Quality gates (10-Oct-2025)

- Build (API/Web): PASS
- Typecheck (tsc API): PASS
- DB migrations/seed: PASS
- API health (/health): PASS
- E2E smoke (apps/api/scripts/smoke-e2e.cjs): PASS
- Nuevos endpoints verificados: /api/event-participants (GET/PUT/DELETE)
  y /api/resources (CRUD)
- Limpieza E2E silenciosa y nuevos DELETE en cuentas/categorías: PASS

## Flujo de trabajo sugerido

- Ramas: `main`, `dev`, feature branches `feat/<modulo>`
- PRs pequeñas, con descripción y checklist
- Convenciones: TypeScript estricto, validación con Zod en endpoints

## Roadmap inicial

- MVP: Roster, Eventos y Comunicación (chat canales)
- Siguientes: Finanzas, Estadísticas, Lesiones, Jugadas, Calendario avanzado

## Web: Comunicaciones

- Panel de canales (crear/seleccionar), chat con scroll y composer.
- Polling liviano cada ~8s usando `since` para nuevos mensajes.
- Desde Eventos, botón “Abrir canal” crea o redirige al canal asociado: navega a `/comunicacion?channelId=ID`.

## Web: Roster Torneo

- Ruta: `/roster-torneo` (navbar).
- Permite seleccionar el plantel por evento (usa `/api/event-participants`).
- Agregar/Quitar jugadores, editar rol/estado inline y exportar CSV del roster del evento.

## Web: Centro de Recursos

- Ruta: `/recursos` (navbar).
- Lista, filtra por texto/categoría y permite crear/eliminar recursos rápidos.
- Campos: título, URL, descripción (opcional), categoría (opcional).
- Acciones: edición inline, borrado múltiple, orden (recientes/título) y exportación CSV.
- VS Code: tarea "Open: Recursos" abre la ruta en el navegador (requiere preview activo en 5176).

Subida de archivos (local)

- Endpoint: `POST /api/resources/upload` con `multipart/form-data` (campo `file`, y opcionales `title`, `description`, `category`).
- Los archivos se guardan en `apps/api/uploads` y se sirven en `GET /uploads/<archivo>`.
- Desde la Web, en la sección “Subir archivo” puedes cargar un archivo; el enlace resultante apunta a `${VITE_API_URL}/uploads/...`.
- Notas:
  - `DELETE /api/resources/:id` por ahora elimina el registro; si quieres que también borre el archivo físico, dilo y lo activo.
  - Para límites de tamaño o filtrado de tipos MIME, puedo añadir validaciones y mensajes de error claros.
  - Límite de tamaño actual: 10 MB por archivo.
  - Tipos permitidos: PDF, PNG, JPEG, GIF y TXT (text/plain).
