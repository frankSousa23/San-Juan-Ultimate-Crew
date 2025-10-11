# TODO / Próximos módulos

Pequeño backlog para próximas iteraciones. Crear issues por cada ítem antes de implementar.

- Centro de Recursos
  - Backend: modelo Resource + endpoints CRUD implementados (sin subida de archivos aún)
  - Pendiente: soporte de archivos subidos (multer/S3), visor enriquecido, edición inline/masiva
  - Web: página `/recursos` implementada (listado, filtros y alta/borrado básico)

- Medios / Marketing
  - Alcance: calendario de contenidos, enlaces a redes, métricas (manuales o API externas)
  - Web: planner semanal, tarjetas KPI, registro de publicaciones

- Reserva (definir alcance)
  - Opción A: reservas de instalaciones/slots
  - Opción B: suplentes/rotaciones para eventos
  - Decidir antes de modelar; documentar casos de uso

- Roster Torneo
  - Backend: listo con `/api/event-participants` (EventParticipant)
  - Web: página dedicada implementada (`/roster-torneo`) con agregar/quitar y exportación CSV
  - Notas: cleanup E2E confirmado y cascadas en Prisma incorporadas para soporte estable de borrados

- Estadísticas avanzadas
  - Comparativas equipo/jugador, filtros por rango de fechas, gráficas adicionales

- Tests y QA
  - Unit tests API (Jest)
  - E2E ligeros para flujos críticos en Web (Playwright)
  - Tarea VS Code disponible para `Web: preview (5176)` que facilita validación manual

---

Estado actualizado (10-Oct-2025):

- Implementado E2E smoke (API) para flujo principal; ver README para ejecución.
- Semillas incluidas para Finanzas, Rivales y Jugadas.
- Borrados en cascada habilitados en Prisma y endpoints DELETE añadidos (accounts/categories).
Pendientes: Centro de Recursos (uploads/visor), Medios, Reserva, y estadísticas avanzadas.
