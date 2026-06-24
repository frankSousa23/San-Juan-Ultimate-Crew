# San Juan Ultimate Crew

![CI](https://github.com/frankSousa23/San-Juan-Ultimate-Crew/actions/workflows/ci.yml/badge.svg)

Sistema de gestión full-stack para el equipo de Ultimate Frisbee San Juan.

## Tecnologías

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Base de Datos**: PostgreSQL

## Inicio Rápido

### Requisitos

- Node.js 18.x
- Docker (para base de datos)

### Configuración

1. **Variables de entorno**:
   ```bash
   # Backend
   cp apps/api/.env.example apps/api/.env
   
   # Frontend
   cp apps/web/.env.example apps/web/.env.local
   ```

2. **Base de datos**:
   ```bash
   docker compose up -d
   npm --workspace apps/api run prisma:generate
   npm --workspace apps/api run prisma:migrate
   npm --workspace apps/api run prisma:seed
   ```

3. **Desarrollo**:
   ```bash
   npm run dev  # Inicia API y Web en paralelo
   ```

## Nota sobre Node (reproducibilidad)

El repo asume **Node 18** (ver `.nvmrc` y `engines` en `package.json`). Si usas otra versión, algunos tests/herramientas pueden fallar.

## Scripts Principales

- `npm run dev` - Desarrollo (API + Web)
- `npm run build` - Compilar para producción
- `npm run test` - Ejecutar tests (API + E2E)
- `npm run start` - Iniciar API en producción

## Estructura

```
apps/
├── api/     # Backend (Express + Prisma)
└── web/     # Frontend (React + Vite)

local/       # Archivos de desarrollo (no se suben al repo)
├── docs/    # Documentación
├── scripts/ # Scripts de desarrollo
└── reports/ # Reportes y auditorías
```

## Autenticación

El sistema incluye autenticación JWT opcional con roles (admin, player, guest).

- **Toggle**: `AUTH_REQUIRED` en `apps/api/.env` (por defecto `false`)
- **Usuario admin**: `admin@example.com` / `admin123`

## Despliegue (Producción)

Para subir el proyecto a la nube, la configuración mínima requerida es:
- **Base de Datos:** PostgreSQL administrado (ej. Supabase, Neon, AWS RDS).
- **Backend:** Plataformas PaaS (Render, Railway, Heroku) inyectando la `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
- **Frontend:** Servicios como Vercel o Netlify inyectando la `VITE_API_URL` que apunte al backend.

**Importante:** En producción, corre `npm run build` y usa `npm run start` en el backend.

## Documentación

- **Swagger UI**: `http://localhost:4000/api-docs` (cuando la API está corriendo). En producción usará la ruta base definida en tu API.
- **Estrategia Comercial y de Testing:** Ver [`local/docs/DEPLOYMENT_AND_STRATEGY.md`](local/docs/DEPLOYMENT_AND_STRATEGY.md) para consejos sobre Beta Testing, Pruebas de Humo (Smoke tests) y la proyección futura hacia **SaaS Multi-Tenant**.
- **Documentación adicional detallada**: Ver `local/docs/`

## Estado del Proyecto

✅ **Backend API** estable con endpoints para:

- Gestión de jugadores, eventos, asistencia
- Comunicaciones (canales y mensajes)
- Finanzas (cuentas, categorías, transacciones)
- Recursos, lesiones, jugadas, rivales
- Autenticación y control de acceso basado en roles

✅ **Frontend** con módulos:

- Dashboard, Roster, Eventos, Comunicaciones
- Finanzas, Recursos, Lesiones, Jugadas, Rivales
- Administración de usuarios y roles

✅ **Testing**:

- Tests unitarios de API (Vitest)
- Tests E2E (Playwright)
- Cobertura de funcionalidades principales

## Licencia

MIT
