## 1. Setup y Estructura del Runner E2E

- [x] 1.1 Crear el archivo de script runner `scripts/run-live-deploy-tests.ts` con configuración para apuntar a la URL desplegada `https://san-juan-ultimate-crew.seenode.app` o a variable de entorno `API_URL`, verificando que compile y ejecute sin errores sintácticos.
- [x] 1.2 Configurar clientes de sesión HTTP con almacenamiento de tokens JWT, headers de autorización y formateador de consola con colores y tiempos de respuesta.

## 2. Fase de Autenticación y Gobernanza RBAC

- [x] 2.1 Implementar prueba de autenticación para el usuario administrador `frankalfonso1988@gmail.com` y verificar obtención de token con rol `admin`.
- [x] 2.2 Implementar registro de usuarios dinámicos para Equipo A (`El Pueblito`), Equipo B (`Warao`) y Anotador Oficial, verificando respuesta en estado `PENDING`.
- [x] 2.3 Implementar aprobación y asignación de roles desde la sesión de administrador (`captain` para Equipo A, `player` para Equipo B, `annotator` para oficial) y verificar que los usuarios puedan iniciar sesión.

## 3. Fase de Gestión de Roster y Aislamiento Multi-Equipo

- [x] 3.1 Implementar creación de atletas para el Equipo A con dorsales únicos y verificar respuesta exitosa.
- [x] 3.2 Implementar prueba de validación de regla de dorsal duplicado en el mismo equipo y verificar rechazo con error 400/409.
- [x] 3.3 Implementar prueba de aislamiento: verificar que el capitán del Equipo A solo liste atletas del Equipo A y que cualquier intento de modificar atletas del Equipo B retorne 403/404.

## 4. Fase de Torneo, Jerarquía y Convocatoria Táctica

- [x] 4.1 Implementar creación de evento torneo principal (`TOURNAMENT`) y generación de partidos hijos (`MATCH` / `GROUP_STAGE`) vinculados por `parentId`.
- [x] 4.2 Implementar asignación de convocatoria en `RosterTorneo` (`EventParticipant`), asignando líneas `O-Line`, `D-Line` y banderas de refuerzo (`isRefuerzo`), verificando persistencia.

## 5. Fase de Mesa Técnica en Vivo, Estadísticas y Cierre

- [x] 5.1 Implementar registro de anotaciones en vivo (Goles, Asistencias, Defensas, Turnovers) desde la sesión del anotador oficial y verificar actualización de marcador.
- [x] 5.2 Implementar registro de planilla de Espíritu de Juego (`SpiritScore`) con métricas WFDF y verificar guardado.
- [x] 5.3 Implementar verificación de estadísticas acumuladas en `/api/stats` y registros en el log de auditoría `/api/audit`.
- [x] 5.4 Ejecutar la suite completa contra el deploy en producción y generar el reporte consolidado de ejecución.
