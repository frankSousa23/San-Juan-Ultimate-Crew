# San Juan Ultimate Crew

Proyecto full-stack para la gestión del equipo de Ultimate Frisbee.

Tecnologías:

- Frontend: Vite + React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Base de Datos: PostgreSQL (con Prisma ORM)

## Requisitos

- Node.js 18+
- Docker (opcional para BD)

## Configuración rápida

• Copiar variables de entorno:

- Backend: `apps/api/.env.example` -> `apps/api/.env`
- Web: `apps/web/.env.example` -> `apps/web/.env.local`

• Levantar PostgreSQL (opcional, con Docker):

- Ver sección "Base de datos con Docker"

• Instalar dependencias en la raíz (workspaces):

- En PowerShell, si hay restricciones, usa `cmd /c`:

```powershell
cmd /c npm install
```

• Generar Prisma Client (opcional hasta tener DB):

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

## Base de datos con Docker

Usa PostgreSQL local con Docker:

- Copia `.env.example` a `.env` en `apps/api` y ajusta `DATABASE_URL` si cambias puertos.
- Levanta el contenedor:

```powershell
docker compose up -d
```

- Ejecuta migraciones (cuando el esquema esté listo):

```powershell
cmd /c npm --workspace apps/api run prisma:migrate
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

- Probar endpoints clave (API en 4000 por defecto del .env.example):

```powershell
node -e "(async()=>{const axios=require('axios');const ok=a=>a.status>=200&&a.status<300;const base='http://localhos
t:4000';const ping=async(p)=>{try{const r=await axios.get(base+p);console.log(p,ok(r)?'OK':r.status)}catch(e){consol
e.log(p,'ERR',e?.response?.status||e.code)}};for(const p of ['/health','/api/players','/api/events','/api/channels','
/api/transactions','/api/stats','/api/injuries','/api/rivals','/api/plays'])await ping(p)})()"
```

Resultados esperados: todos en OK.

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
