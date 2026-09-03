## 1. Modelos de Jugadas y Esquemas de Pizarra Táctica

- [x] 1.1 Registrar en `apps/api/src/routes/plays.ts` y en `apps/api/src/lib/mockDb.ts` las jugadas predeterminadas "Vertical Stack: Corte al Break-side" y "Defensa Zonal: 3-3-1 Cup" con descripciones tácticas, roles y llamadas de juego.
- [x] 1.2 Implementar en `apps/web/src/components/TacticalBoard.tsx` el renderizado de la cancha reglamentaria WFDF (campo central de 70 yd, ancho de 40 yd, zonas de gol de 20 yd, marcas de brick y líneas de yardaje).

## 2. Animación Interactiva y Verificación de Playbook

- [x] 2.1 Implementar la animación interactiva de corte ofensivo y trayectoria del disco en `TacticalBoard.tsx` con controles de Reproducir, Pausar y Reiniciar simulación.
- [x] 2.2 Integrar los nuevos esquemas en `Plays.tsx` y certificar compilación frontend (`npm run lint`) y pruebas unitarias (`npm test`) con 100% de éxito.
