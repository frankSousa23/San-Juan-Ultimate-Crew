# Porting diseños TXT a React (Tailwind)

Este documento lista las vistas a portar y el mapeo de componentes.

## Dashboard

- Secciones: Quick Stats, Cards de navegación, Actividad Reciente.
- Componentes: QuickStatCard, NavCard, RecentActivityItem.

## Roster

- Grid de jugadores → PlayerCard
- Modal de detalle → PlayerModal
- Filtros de búsqueda/posición/estado

## Eventos

- Tabs (Eventos/Calendario/Torneos/Estadísticas)
- CalendarGrid, EventCard, TournamentBracket.

## Comunicación

- Tabs (Chat, Foros, Mensajes, Anuncios)
- ChannelList, ChatWindow, MessageItem.

---

Estrategia: Migrar HTML Tailwind a componentes y conectar a API cuando los endpoints estén listos.

---

Estado de porting (10-Oct-2025):

- Portado y conectado a API: Dashboard, Roster, Eventos (con asistencia), Comunicación (canales y chat), Finanzas, Estadísticas, Lesiones, Rivales y Jugadas (incluye preview Markdown y exportación CSV donde aplica).
- Parcial: Vista Calendario avanzada, comparativas de estadísticas avanzadas.
- Pendiente: Centro de Recursos, Medios/Marketing, Reserva, Roster Torneo.

Actualizaciones técnicas (10-Oct-2025):

- Docker Compose: eliminado campo `version` para evitar warning obsoleto.
- Prisma: agregados onDelete (Cascade/SetNull) en relaciones clave (EventParticipant, Channel↔Event, Message↔Channel/author, Attendance↔Player/Event, Injury↔Player).
- API Finanzas: añadidos endpoints DELETE para Accounts y Categories para un cleanup consistente.
- E2E: cleanup reordenado y silencioso; ver `apps/api/scripts/smoke-e2e.cjs`.
