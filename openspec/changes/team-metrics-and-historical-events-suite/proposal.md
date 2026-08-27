## Why

En la vista de Gestión de Equipos y Divisiones (`/admin/equipos`), las tarjetas de los clubes mostraban contadores en 0 para jugadores, usuarios y eventos debido a la falta de resolución de `include._count` para la entidad `team` en el backend. Asimismo, se requiere poblar y auditar eventos históricos completados (`status: 'COMPLETED'`) con estadísticas completas por atleta (`PlayerMatchStats`) y Espíritu de Juego SOTG (`SpiritScore`) para que todos los módulos de estadísticas reflejen un historial deportivo coherente.

## What Changes

- **1. Corrección del Adaptador de Equipos y Métricas Agregadas:**
  - Implementar la resolución de `include._count` (jugadores, usuarios, eventos) y `include.players` para la entidad `team` en `apps/api/src/lib/mockDb.ts`.
  - Asegurar que `GET /api/teams` retorne los conteos agregados reales para todos los clubes.
- **2. Generación y Auditoría de Eventos Históricos Concluidos (`COMPLETED`):**
  - Creación de partidos pasados con actas cerradas, anotaciones play-by-play y estadísticas acumuladas por atleta (`goals`, `assists`, `defenses`, `turnovers`, `pointsPlayed`).
  - Asignación de evaluaciones SOTG WFDF por encuentro en las 5 dimensiones reglamentarias.
- **3. Expansión de la Suite de Certificación en Vivo (Fase 20):**
  - Implementación de la Fase 20 en `scripts/run-live-deploy-tests.ts` para certificar la respuesta de métricas de equipos y agregación de estadísticas históricas de atletas.

## Capabilities

### New Capabilities
<!-- No se crean capacidades nuevas, se extiende la suite de verificación de métricas y eventos -->

### Modified Capabilities
- `e2e-live-verification`: Se agregan requerimientos de agregación de métricas de equipos (`_count`), eventos históricos cerrados y acumulación de estadísticas individuales de atletas.

## Impact

- **Backend (`apps/api/src/lib/mockDb.ts` & `routes/teams.ts`):** Resolución completa de `_count` para equipos.
- **Frontend (`apps/web/src/pages/AdminTeams.tsx`):** Las tarjetas de equipos mostrarán las métricas reales de atletas, usuarios y eventos.
- **Test Suite (`scripts/run-live-deploy-tests.ts`):** Adición de la Fase 20 para validar equipos y estadísticas históricas.
