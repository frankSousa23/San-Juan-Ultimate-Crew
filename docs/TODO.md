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
  - Derivar desde Players + Events: selección por evento/torneo
  - Web: página dedicada para seleccionar plantel por evento, exportación a CSV

- Estadísticas avanzadas
  - Comparativas equipo/jugador, filtros por rango de fechas, gráficas adicionales

- Tests y QA
  - Unit tests API (Jest)
  - E2E ligeros para flujos críticos en Web (Playwright)
