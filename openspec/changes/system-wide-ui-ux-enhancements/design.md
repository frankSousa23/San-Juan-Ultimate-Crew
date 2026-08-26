## Context

La interfaz web (`apps/web`) cuenta con 24 vistas y más de 60 componentes, soportada por Tailwind CSS y Lucide Icons. Buscamos elevar la ergonomía de campo y reducir la sobrecarga cognitiva en navegación y operaciones frecuentes sin alterar las rutas ni romper contratos de backend.

## Goals / Non-Goals

**Goals:**
- Agrupar la navegación en 5 secciones semánticas colapsables en `Layout.tsx`.
- Añadir Hero Card interactiva y Quick Action Bar en `Dashboard.tsx`.
- Optimizar la experiencia táctil en la mesa técnica (`LiveAnnotationsTable.tsx` / `Annotations.tsx`).
- Integrar controles de línea de tiempo y exportación en `Plays.tsx`.
- Integrar semáforos de salud y filtros rápidos en `Roster.tsx`.

**Non-Goals:**
- Modificar esquemas de base de datos ni modelos de Prisma.
- Cambiar rutas URL ya indexadas.

## Decisions

1. **Agrupación Modular del Sidebar:**
   - Crear categorías: `Operación Deportiva`, `Táctica & Rendimiento`, `Club & Salud`, `Gestión & Finanzas`, `Administración`.
   - Persistir el estado abierto/cerrado de los grupos durante la sesión.

2. **Mesa Técnica Field-First:**
   - Teclado de selección de dorsal en 1 toque.
   - Botón toggle de "Modo Sol" (High-Contrast Outdoor).

3. **Exportación Táctica Canvas/DOM:**
   - Usar `html2canvas` (ya disponible en el bundle) para exportar el canvas táctico a PNG.

## Risks / Trade-offs

- **[Riesgo] Tamaño de bundle:**
  - *Mitigación:* Se aprovechan librerías ya instaladas (`html2canvas`, `lucide-react`) sin agregar dependencias externas pesadas.
