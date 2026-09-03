## 1. Componente de Gráfico Radar Pentagonal y Mapeo de Atletas

- [x] 1.1 Crear el componente reutilizable `apps/web/src/components/PlayerRadarChart.tsx` con polígonos de 5 ejes (Catching, Throwing, Defense, Spirit, Stamina), rejillas concéntricas, etiquetas con iconos y soporte para superposición comparativa.
- [x] 1.2 Implementar en `apps/web/src/lib/performanceStats.ts` las funciones de cálculo y normalización para derivar los 5 ejes de habilidad a partir de los datos de juego de los atletas y del equipo.

## 2. Integración en Dashboard y Estadísticas

- [x] 2.1 Integrar en `apps/web/src/pages/Dashboard.tsx` el panel de rendimiento con el radar del equipo, desglose de roles (Handler vs Cutter) e indicadores tácticos de precisión (Huck Accuracy % y Stall-out Resistance %).
- [x] 2.2 Integrar el radar individual y comparativo en `apps/web/src/pages/Statistics.tsx` y certificar compilación frontend (`npm run lint`) y pruebas unitarias (`npm test`) al 100%.
