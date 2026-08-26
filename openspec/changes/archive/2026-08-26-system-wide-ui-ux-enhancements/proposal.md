## Why

SIGEDIVO cuenta con una robustez de backend certificada al 100%, pero la interfaz cliente presenta áreas de mejora en la ergonomía móvil y reducción de carga cognitiva: un menú lateral plano con 18 opciones sin agrupación semántica, un panel principal sin accesos directos a acciones en vivo, selectores pequeños en mesa técnica para uso en campo bajo luz solar, y herramientas tácticas sin controles de animación ni exportación de esquemas.

## What Changes

- **1. Navegación Semántica y Menú Lateral Modular (`Layout.tsx` & `Sidebar.tsx`):**
  - Reorganización de los 18 elementos del menú en 5 categorías semánticas colapsables (Operación Deportiva, Táctica & Rendimiento, Club & Salud, Gestión Financiera, Administración & Sistema) reduciendo drásticamente la altura y el scroll vertical en móviles.
- **2. Dashboard Interactivo y "Live Action Hub" (`Dashboard.tsx`):**
  - Incorporación de una "Live Hero Card" que destaca partidos en curso o próximos eventos con botón directo de 1 clic a la Mesa Técnica.
  - Barra de Accesos Rápidos (*Quick Action Bar*) para crear eventos, registrar anotaciones, reportar lesiones o ingresar transacciones.
- **3. Mesa Técnica Táctil "Field-First" (`LiveAnnotationsTable.tsx` / `Annotations.tsx`):**
  - Grid numérico de botones táctiles grandes para selección rápida de anotador y asistente con micro-animaciones `active:scale-95`.
  - Modo "High-Contrast Outdoor" para máxima legibilidad bajo sol directo en cancha.
- **4. Pizarra Táctica y Playbook Dinámico (`Plays.tsx` & `TacticalBoard.tsx`):**
  - Controles de velocidad de reproducción (0.5x, 1x, 1.5x, 2x) y scrubber de línea de tiempo paso a paso.
  - Botón de exportación rápida de la pizarra como imagen PNG para compartir en mensajería móvil.
- **5. Roster y Salud con Semáforo de Disponibilidad (`Roster.tsx`):**
  - Indicadores visuales de estado de salud (🟢 Activo, 🟡 En Recuperación, 🔴 Baja Médica) y filtros rápidos de 1 toque (Pill Filters) por posición y línea táctica (O-Line/D-Line).

## Capabilities

### New Capabilities
- `ui-ux-enhancements`: Especificación formal de los estándares visuales, navegación categorizada, controles táctiles en cancha, simulación táctica y semáforo de disponibilidad física.

### Modified Capabilities
<!-- No se modifican contratos de backend; se expande la experiencia de usuario -->

## Impact

- **Frontend (`apps/web`):** Modificación de `Layout.tsx`, `Dashboard.tsx`, `LiveAnnotationsTable.tsx`, `Plays.tsx`, `Roster.tsx` y componentes UI compartidos.
- **Backend (`apps/api`):** Sin cambios destructivos ni de breaking changes (100% compatible con todos los 22 endpoints existentes).
