## Context

En la vista de Gestión de Equipos (`/admin/equipos`), el objeto `_count` no era resuelto por `mockDb.ts` para la entidad `team`, mostrando valores en 0. Asimismo, se requiere consolidar partidos completados (`COMPLETED`) con historial estadístico por atleta.

## Goals / Non-Goals

**Goals:**
- Añadir el manejador para `tableName === 'team'` en `resolveInclude` de `apps/api/src/lib/mockDb.ts` para resolver `include._count` (`players`, `users`, `events`) e `include.players`.
- Crear y certificar partidos completados con anotaciones y estadísticas individuales.
- Agregar la Fase 20 en `scripts/run-live-deploy-tests.ts`.

## Decisions

1. **Resolución en `mockDb.ts`:**
   - En `resolveInclude`, filtrar `dbInstance.players`, `dbInstance.users` y `dbInstance.events` por `teamId` para generar el objeto `_count` exacto.
2. **Pruebas en Vivo (Fase 20):**
   - Verificar que `GET /api/teams` retorne equipos con métricas `_count.players`, `_count.users` y `_count.events` mayores o iguales a 0, y que los partidos con estado `COMPLETED` acumulen estadísticas en el perfil del atleta.
