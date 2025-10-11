# TODO / Próximas iteraciones

Pequeño backlog para próximas iteraciones. Crear issues por cada ítem antes de implementar.

- Centro de Recursos
  - Backend: Implementado con CRUD, paginado, categorías, export, subida de archivos local (límite 10 MB, tipos PDF/PNG/JPEG/GIF/TXT) y estáticos `/uploads/...`.
  - Web: Página `/recursos` con URL-sync (q/categoría/orden/limit), edición inline, borrado múltiple, previsualización imágenes/PDF y export CSV con BOM.
  - Pendiente: Opcional S3 en vez de almacenamiento local; visor enriquecido para más tipos.

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

Estado actualizado (11-Oct-2025):

Implementado: E2E smoke (API) para flujo principal; semillas para Finanzas, Rivales y Jugadas; cascadas en Prisma y DELETE en accounts/categories.
Novedades: Centro de Recursos con uploads/visor básico y URL-sync; Jugadas y Lesiones con URL-sync en filtros y tamaño de página.
Pendientes: Medios, Reserva, estadísticas avanzadas y pruebas automatizadas Web.
