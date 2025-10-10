# Mapa de Diseño → Implementación

Este documento resume cada archivo de diseño (.txt) y cómo quedó integrado en el sistema actual. Estados posibles: Implementado, Parcial, Pendiente.

Nota: Algunos .txt eran variantes del mismo módulo (p.ej., “Finanzas”, “Gestión Financiera” y “Sistema de Finanzas”); se unificaron bajo un solo módulo en el sistema.

## Documentos y mapeo

- Dashboard.txt
  - Propósito: Página de inicio con métricas rápidas, accesos a módulos y tarjeta de marketing.
  - Implementación: Página Dashboard en el frontend (SPA) con tarjetas y accesos a Roster, Estadísticas, Eventos/Calendario, Jugadas, etc.
  - Estado: Implementado.
  - Rutas API relacionadas: /api/stats (resúmenes), /api/events (próximos eventos).

- Eventos.txt / Sistema de Eventos.txt / Calendario.txt
  - Propósito: Gestión de eventos (entrenamientos, torneos, sociales), calendario, detalles y asistencia.
  - Implementación: Módulo de Eventos en frontend con asistencia integrada; backend con /api/events y /api/attendance.
  - Estado: Implementado (vista calendario avanzada: Parcial).
  - Rutas API: /api/events, /api/attendance.

- Comunicaciones.txt / Sistema de Comunicación.txt / Chat.txt
  - Propósito: Centro de comunicaciones, canales, chat/mensajería, anuncios básicos.
  - Implementación: Módulo de Comunicaciones con canales y mensajes, polling, listas; UI y flujos principales.
  - Estado: Implementado.
  - Rutas API: /api/channels, /api/messages.

- Finanzas.txt / Gestión Financiera.txt / Sistema de Finanzas.txt
  - Propósito: Cuentas, categorías, transacciones, resúmenes y exportación.
  - Implementación: Módulo de Finanzas con filtros, tarjetas de resumen, CRUD, CSV export; datos sembrados.
  - Estado: Implementado.
  - Rutas API: /api/accounts, /api/categories, /api/transactions, /api/stats (resumen).

- Estadísticas.txt / Análisis de Rendimiento.txt / Panel de Análisis.txt
  - Propósito: Métricas de equipo e individuales, gráficos y comparativas.
  - Implementación: Página de Estadísticas con KPIs y agregados; comparativas avanzadas se pueden ampliar.
  - Estado: Implementado (comparativas avanzadas: Parcial).
  - Rutas API: /api/stats.

- Lesiones.txt
  - Propósito: Registro y seguimiento de lesiones (severidad, estado, timeline) con filtros.
  - Implementación: Módulo de Lesiones con filtros persistentes, paginación y exportación CSV.
  - Estado: Implementado.
  - Rutas API: /api/injuries.

- Rivales.txt
  - Propósito: Scouting de equipos rivales, puntos fuertes/débiles, formaciones.
  - Implementación: Módulo de Rivales con búsqueda, paginación y CSV export; datos ejemplo en seed.
  - Estado: Implementado.
  - Rutas API: /api/rivals.

- Jugadas.txt
  - Propósito: Biblioteca de jugadas, categorías, descripción y animaciones/esquemas.
  - Implementación: Módulo de Jugadas con filtros persistentes, paginación, vista/preview Markdown y exportación CSV.
  - Estado: Implementado.
  - Rutas API: /api/plays.

- Roster Principal.txt
  - Propósito: Gestión de jugadores (posición, estado, métricas básicas) y vista del plantel.
  - Implementación: Módulo de Roster/Players en frontend; backend con entidad Player.
  - Estado: Implementado.
  - Rutas API: /api/players.

- Roster Torneo.txt
  - Propósito: Selección específica para torneos con configuración de alineaciones.
  - Implementación: Selección y gestión específica no se implementó aún como vista dedicada.
  - Estado: Pendiente (se puede derivar de Players + Events).
  - Rutas API: N/A (por definir si requiere entidad/relación específica).

- Centro de Recursos.txt
  - Propósito: Repositorio de archivos/recursos, posiblemente con categorías y descargas.
  - Implementación: No implementado.
  - Estado: Pendiente.
  - Rutas API: N/A.

- Medios.txt
  - Propósito: Contenidos de redes/marketing, KPIs sociales.
  - Implementación: No hay módulo dedicado; se refleja sólo una tarjeta en el Dashboard.
  - Estado: Pendiente.
  - Rutas API: N/A.

- Reserva.txt
  - Propósito: Mecanismo de reservas (espacios/turnos) o listado de suplentes/rotaciones.
  - Implementación: No implementado; requeriría clarificar alcance (instalaciones vs. alineaciones).
  - Estado: Pendiente.
  - Rutas API: N/A.

## Entidades y endpoints principales ya disponibles

- Player: /api/players
- Event (+ asistencia): /api/events, /api/attendance
- Channel/Message (comunicaciones): /api/channels, /api/messages
- Finanzas: Account, Category, Transaction → /api/accounts, /api/categories, /api/transactions
- Estadísticas: /api/stats (agregados)
- Lesiones: /api/injuries
- Rivales: /api/rivals
- Jugadas: /api/plays

## Notas finales

- Los .txt se usaron como prototipos de UI. El sistema consolidó y normalizó estos diseños en módulos React + API REST.
- Para módulos “Pendiente”, abrimos opción de issues/tickets con alcance funcional y de datos antes de implementar.
