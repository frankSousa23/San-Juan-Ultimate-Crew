## Purpose

Proveer una experiencia de usuario moderna, ergonómica y optimizada para dispositivos móviles y uso en campo deportivo, con navegación agrupada por módulos, centro de acciones rápidas, mesa técnica táctil y herramientas visuales interactivas.

## ADDED Requirements

### Requirement: Categorized and Responsive Navigation System
El sistema DEBE organizar las opciones de navegación lateral en categorías semánticas colapsables (Operación Deportiva, Táctica & Rendimiento, Club & Salud, Gestión & Tesorería, Administración), manteniendo los filtros de rol RBAC existentes.

#### Scenario: User navigates categorized sidebar
- **WHEN** el usuario abre el menú lateral en escritorio o dispositivo móvil
- **THEN** las opciones se presentan agrupadas por categoría con indicadores de colapso y sin sobrecargar la pantalla con listas planas.

### Requirement: Live Action Hub and Dashboard Quick Actions
El panel de control DEBE incorporar una tarjeta destacada de evento en curso o próximo con acceso directo a mesa técnica y una barra de acciones rápidas para tareas frecuentes.

#### Scenario: User accesses live event from dashboard
- **WHEN** un usuario autenticado visualiza el dashboard con partidos programados
- **THEN** el sistema muestra la tarjeta del partido con botón de acceso directo en 1 clic a las anotaciones en vivo y botones de acción rápida.

### Requirement: Touch-Optimized Live Match Annotations
El sistema DEBE proveer controles táctiles optimizados con teclado de selección rápida de dorsales y modo de alto contraste para exteriores en la mesa técnica.

#### Scenario: Annotator registers point in outdoor mode
- **WHEN** el anotador registra una acción de gol o asistencia en condiciones de campo abierto
- **THEN** la interfaz permite seleccionar los números de dorsal mediante botones táctiles grandes con micro-animaciones y opción de alto contraste.

### Requirement: Tactical Playbook Timeline Controls and Image Export
La pizarra táctica DEBE permitir pausar, retroceder y avanzar las animaciones con selector de velocidad (0.5x - 2x) y exportar el esquema táctico como imagen PNG.

#### Scenario: Coach exports tactical play to image
- **WHEN** el entrenador visualiza una jugada ofensiva o defensiva y presiona exportar
- **THEN** el sistema genera y descarga una imagen PNG del diagrama con las trayectorias de los jugadores y el disco.

### Requirement: Visual Roster Health Availability Badges
El roster DEBE presentar semáforos visuales de disponibilidad médica (Activo, En Recuperación, Baja Médica) y filtros rápidos de un toque por posición y línea táctica.

#### Scenario: Filtering roster by line type
- **WHEN** el capitán o entrenador aplica un filtro de línea táctica (O-Line / D-Line)
- **THEN** la lista de atletas se actualiza inmediatamente mostrando los jugadores correspondientes con su estado de salud visible.
