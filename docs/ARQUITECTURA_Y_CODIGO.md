# 🥏 SIGEDIVO — Arquitectura del Sistema y Guía Explicativa del Código

**Plataforma:** SIGEDIVO (Sistema de Gestión para el Disco Volador)  
**Versión:** 1.2.0 (Open Source / Licencia MIT)  
**Autor:** Frank Sousa (`frankSousa23`) & San Juan Ultimate Crew  

---

## 📌 1. Visión General de la Arquitectura

SIGEDIVO está diseñado bajo una arquitectura **Full-Stack desacoplada y modular** contenida en un monorepositorio con TypeScript de extremo a extremo.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTE (apps/web)                                   │
│  React 18 + Vite 6 + Tailwind CSS + Lucide Icons + jsPDF + Context API (Auth/Toast)  │
└───────────────────────────────────────────▲────────────────────────────────────────────┘
                                            │ Peticiones HTTP / REST API (JSON)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SERVIDOR UNIFICADO (server.ts)                            │
│  - En Desarrollo: Vite Dev Server Middleware (HMR / ESM bajo demanda)                  │
│  - En Producción: Servidor Express con entrega de estáticos y SPA Fallback (index.html)│
└───────────────────────────────────────────▲────────────────────────────────────────────┘
                                            │ Enrutamiento y Middlewares
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND (apps/api)                                   │
│  - Seguridad: Helmet CSP, CORS, Rate Limiters (General, Auth, Uploads, Write/Read)     │
│  - Autenticación: JWT (JSON Web Tokens) con RBAC (Matriz de 9 Roles y Permisos)        │
│  - Rutas REST: /api/teams, /api/players, /api/events, /api/annotations, /api/stats... │
│  - Documentación Swagger / OpenAPI 3.0 (/api-docs)                                     │
└───────────────────────────────────────────▲────────────────────────────────────────────┘
                                            │ Abstracción Proxy Transparente
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE PERSISTENCIA (apps/api/src/lib)                       │
│  - Modo Producción: PostgreSQL 16 vía Prisma ORM 7 (`@prisma/adapter-pg` + `pg.Pool`)   │
│  - Modo Contenedor / Resiliencia: Base de datos en memoria (`mockDb.ts`) sin caída     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 2. Estructura de Directorios y Módulos Principales

| Ruta | Descripción y Responsabilidad |
| :--- | :--- |
| `/server.ts` | **Punto de entrada unificado:** Inicializa Express, integra Vite en desarrollo y sirve la SPA en producción en el puerto `3000`. |
| `/apps/api/src/app.ts` | **Configuración de Express:** Middlewares de seguridad (Helmet, CORS, compresión, rate limiting), rutas API REST y Swagger. |
| `/apps/api/src/lib/prisma.ts` | **Capa de Abstracción de Datos:** Cliente Proxy que conecta con PostgreSQL real o conmuta a `mockDb` sin romper la ejecución. |
| `/apps/api/src/lib/mockDb.ts` | **Almacén Transaccional en Memoria:** Datos semilla completos de equipos, atletas, eventos, finanzas y estadísticas. |
| `/apps/api/src/routes/` | **Enrutadores REST Modulares:** `teams.ts`, `players.ts`, `events.ts`, `annotations.ts`, `stats.ts`, `auth.ts`, `users.ts`, `finances.ts`, `plays.ts`, `injuries.ts`, `rivals.ts`. |
| `/apps/api/src/middleware/` | **Seguridad y Control:** `auth.ts` (JWT/RBAC), `security.ts` (Rate Limiters, Sanitización), `errorHandler.ts` y `logging.ts`. |
| `/apps/web/src/App.tsx` | **Enrutador Frontend:** Rutas públicas (`/login`, `/register`), privadas protegidas por rol y modal interactivo de manual. |
| `/apps/web/src/contexts/AuthContext.tsx` | **Estado Global de Sesión:** Manejo de tokens, inicio de sesión estándar y Modo Invitado (1-Clic), validación de roles (`hasRole`). |
| `/apps/web/src/features/events/` | **Mesa Técnica y Torneos:** Pizarrón de anotaciones en vivo (`LiveAnnotationsTable.tsx`), registro de puntos táctiles y actas de partido. |
| `/apps/web/src/pages/Plays.tsx` | **Playbook y Simulador Táctico:** Animación interactiva de formaciones (*Vertical Stack*, *Horizontal Stack*, *Cup 3-3-1*) y pizarra libre. |
| `/apps/web/src/components/SystemManualModal.tsx` | **Manual del Sistema:** Visualizador interactivo de manual de operaciones, permisos RBAC, diagramas WFDF y exportador en PDF. |

---

## 🔍 3. Explicación de los Bloques de Código Más Destacables

### 3.1. Servidor Híbrido (`server.ts`)
Permite que un único comando (`npm run dev` o `npm run start`) maneje tanto la API como la interfaz visual:
- **Detección de Entorno:** Si `NODE_ENV !== 'production'`, importa dinámicamente `vite.createServer({ server: { middlewareMode: true } })` e inyecta los scripts en `index.html` al vuelo.
- **SPA Fallback:** Cualquier petición que no coincida con rutas de backend (`/api/*`, `/health`, `/api-docs`) devuelve `index.html` con código HTTP 200, permitiendo que `react-router` resuelva rutas profundas como `/admin/equipos` o `/torneo/1/partido/2`.

### 3.2. Resiliencia de Datos con Proxy (`apps/api/src/lib/prisma.ts`)
Garantiza que la aplicación nunca falle ni se detenga ante la ausencia momentánea de una base de datos PostgreSQL:
- Si `DATABASE_URL` no está definida o apunta a localhost sin servicio activo, activa `dbOffline = true`.
- Mediante un `Proxy` de JavaScript, cualquier llamada como `prisma.player.findMany(...)` o `prisma.matchEvent.create(...)` es capturada y ejecutada de forma transparente contra los arreglos transaccionales en memoria de `mockDb.ts`.

### 3.3. Control de Acceso Basado en Roles (RBAC en `apps/api/src/middleware/auth.ts` y `AuthContext.tsx`)
Implementa seguridad por capas para proteger las operaciones del club:
- **`admin` / `directiva`**: Acceso total de lectura, escritura y aprobación de nuevos usuarios.
- **`captain` / `coach`**: Gestión del Roster, convocatorias, líneas tácticas (O-Line, D-Line) y Playbook.
- **`annotator`**: Control exclusivo de Mesa Técnica, registro de goles, asistencias y Espíritu de Juego (SOTG).
- **`treasurer`**: Acceso completo al libro contable, balance bancario y caja chica.
- **`player`**: Edición de su ficha personal y confirmación de asistencia (RSVP).
- **`guest`**: Acceso de solo lectura de demostración en 1 solo clic.

### 3.4. Anotaciones en Vivo y Mesa Técnica (`LiveAnnotationsTable.tsx`)
Diseñado para la velocidad y precisión táctil requerida en el campo de juego:
- **Marcador Sticky:** Siempre visible en pantalla fija durante el scroll.
- **Registro en 1 Toque:** Al pulsar sobre un jugador, se abre un selector rápido para indicar quién dio la asistencia o si fue una anotación sin asistencia (Callahan / Error Rival).
- **Cálculo Automático:** Cada anotación incrementa en tiempo real los goles, asistencias y diferencial `+/-` de los atletas involucrados, actualizando las tablas de líderes del torneo.

---

## 🧪 4. Pruebas y Validación de Calidad

El proyecto incluye un pipeline exhaustivo de pruebas automatizadas:
- **Pruebas Unitarias y de Integración API:** Ejecutadas con `vitest` en `apps/api/src/*.test.ts` (pruebas de autenticación, control de roles, consistencia de datos y flujo de registro).
- **Pruebas End-to-End (E2E):** Ejecutadas con `playwright` en `apps/web/tests/`.
- **Verificación de Tipos y Linter:** `npm run lint` y `npm run build` aseguran compilación 100% limpia sin advertencias críticas.
