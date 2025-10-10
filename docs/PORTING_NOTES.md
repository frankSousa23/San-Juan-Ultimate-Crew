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
