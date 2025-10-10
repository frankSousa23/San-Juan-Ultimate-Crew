# TODO / Próximos módulos

Pequeño backlog para próximas iteraciones. Crear issues por cada ítem antes de implementar.

- Centro de Recursos
  - Backend: modelo Resource { id, title, description?, url | file, category?, createdAt }
  - Endpoints: GET/POST/PUT/DELETE /api/resources, subida de archivos (multer/s3 según entorno)
  - Web: listado, filtros por categoría, subida/edición, visor simple

- Medios / Marketing
  - Alcance: calendario de contenidos, enlaces a redes, métricas (manuales o API externas)
  - Web: planner semanal, tarjetas KPI, registro de publicaciones

- Reserva (definir alcance)
  - Opción A: reservas de instalaciones/slots
  - Opción B: suplentes/rotaciones para eventos
  - Decidir antes de modelar; documentar casos de uso

- Roster Torneo
  - Backend: listo con `/api/event-participants` (EventParticipant)
  - Web: página dedicada para seleccionar plantel por evento, exportación a CSV
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
Pendientes: Centro de Recursos, Medios, Reserva, Roster Torneo (vista web) y estadísticas avanzadas.
