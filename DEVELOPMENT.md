# 🚀 Guía de Desarrollo - San Juan Ultimate Crew

Esta guía te ayudará a configurar y ejecutar el proyecto en tu entorno de desarrollo.

## 📋 Prerrequisitos

- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **Docker Desktop** - [Descargar aquí](https://www.docker.com/products/docker-desktop/)
- **Git Bash** (recomendado para Windows)

## ⚡ Configuración Rápida

### 1. Clonar y configurar
```bash
git clone <tu-repo>
cd san-juan-ultimate-crew
```

### 2. Configuración automática
```bash
# Opción 1: Script completo (recomendado)
npm run setup

# Opción 2: Scripts individuales
./scripts/create-env-files.sh
./scripts/setup-dev.sh
```

### 3. Verificar instalación
```bash
npm run check
```

## 🎯 Comandos Principales

### Desarrollo
```bash
# Iniciar todo (API + Web)
npm run dev

# Solo API
npm run dev:api

# Solo Web
npm run dev:web

# Inicio rápido (si API ya está corriendo)
./scripts/start-dev.sh
```

### Base de Datos
```bash
# Levantar base de datos
npm run db:up

# Detener base de datos
npm run db:down

# Reiniciar base de datos
npm run db:reset

# Migraciones y seed
npm run prisma:reset
```

### Testing
```bash
# Todas las pruebas
npm run test

# Solo tests de API
cd apps/api && npm run test

# Solo tests E2E
cd apps/web && npm run test:e2e
```

### Verificación
```bash
# Estado del proyecto
npm run check

# Smoke test E2E
npm run smoke:e2e
```

## 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:5173
- **API**: http://localhost:4000
- **API Health**: http://localhost:4000/health
- **Base de datos**: localhost:5432

## 👥 Usuarios de Prueba

| Rol | Email | Password | Descripción |
|-----|-------|----------|-------------|
| Admin | admin@example.com | admin123 | Acceso completo |
| Guest | guest@example.com | admin123 | Acceso limitado |
| Player | player@example.com | admin123 | Jugador vinculado |

## 🔧 Configuración de Autenticación

Por defecto, la autenticación está **desactivada** (`AUTH_REQUIRED=false`).

Para activarla:
1. Edita `apps/api/.env`
2. Cambia `AUTH_REQUIRED=true`
3. Reinicia la API

## 📁 Estructura del Proyecto

```
san-juan-ultimate-crew/
├── apps/
│   ├── api/                 # Backend (Node.js + Express + Prisma)
│   └── web/                 # Frontend (React + Vite + TypeScript)
├── scripts/                 # Scripts de automatización
├── docs/                    # Documentación
└── .github/workflows/       # CI/CD
```

## 🐛 Solución de Problemas

### Docker no funciona
```bash
# Verificar Docker
docker --version
docker info

# Reiniciar Docker Desktop
# Luego ejecutar:
npm run db:reset
```

### API no responde
```bash
# Verificar estado
npm run check

# Reiniciar API
npm run dev:api
```

### Base de datos no conecta
```bash
# Verificar contenedor
docker compose ps

# Reiniciar base de datos
npm run db:reset

# Verificar migraciones
npm run prisma:reset
```

### Tests fallan
```bash
# Verificar base de datos
npm run db:up

# Ejecutar migraciones
npm run prisma:reset

# Ejecutar tests
npm run test
```

## 📊 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `./scripts/setup-dev.sh` | Configuración completa inicial |
| `./scripts/start-dev.sh` | Inicio rápido (requiere API corriendo) |
| `./scripts/test-all.sh` | Ejecutar todas las pruebas |
| `./scripts/quick-check.sh` | Verificar estado del proyecto |
| `./scripts/create-env-files.sh` | Crear archivos .env |

## 🔄 Flujo de Trabajo Recomendado

1. **Configuración inicial**: `npm run setup`
2. **Desarrollo diario**: `npm run dev`
3. **Antes de commit**: `npm run test`
4. **Verificación**: `npm run check`

## 📝 Notas Importantes

- Los archivos `.env` se crean automáticamente
- La base de datos se resetea en cada test
- Los scripts están optimizados para Git Bash
- El proyecto usa workspaces de npm

## 🆘 Ayuda

Si tienes problemas:

1. Ejecuta `npm run check` para diagnóstico
2. Revisa los logs en la consola
3. Verifica que Docker esté corriendo
4. Consulta la documentación en `docs/`

---

**¡Listo para desarrollar! 🎉**
