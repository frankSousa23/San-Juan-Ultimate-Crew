## 1. Corrección del Adaptador de Equipos y Agregación de Métricas

- [x] 1.1 Modificar `apps/api/src/lib/mockDb.ts` agregando la resolución de `include._count` (`players`, `users`, `events`) e `include.players` para la entidad `team`.
- [x] 1.2 Validar que `GET /api/teams` retorne los conteos agregados reales y que la vista `/admin/equipos` renderice las métricas de cada club.

## 2. Creación y Certificación de Eventos Históricos Pasados con Estadísticas

- [x] 2.1 Implementar caso de prueba de creación de partido histórico completado (`status: 'COMPLETED'`) con registro play-by-play y estadísticas acumuladas por atleta.
- [x] 2.2 Validar que la consulta de estadísticas del atleta (`GET /api/players/:id` o `/api/stats`) refleje la sumatoria acumulada de goles, asistencias y defensas.

## 3. Certificación E2E Ampliada en Producción

- [x] 3.1 Añadir la Fase 20 en `scripts/run-live-deploy-tests.ts` y ejecutar la suite completa certificando 100% PASS.
