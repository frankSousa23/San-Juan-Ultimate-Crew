## 1. Módulo de Finanzas y Tesorería

- [x] 1.1 Implementar registro y autenticación de sesión con rol `treasurer`, creación de cuentas contables (`CASH`, `BANK`), categorías de flujo y transacciones (`INCOME`, `EXPENSE`).
- [x] 1.2 Implementar verificación de balance consolidado en `/api/transactions/summary/overall` y prueba negativa de restricción RBAC para usuarios no autorizados (código 403).

## 2. Módulos de Salud, Rivales y Pizarrón Táctico

- [x] 2.1 Implementar registro de lesión médica en `/api/injuries` con severidad `MODERATE`, transición de estado a `RESOLVED` y verificación de restauración de disponibilidad del atleta.
- [x] 2.2 Implementar creación de club rival en `/api/rivals`, registro de jugadores rivales y anotación de puntos versus en partido oficial.
- [x] 2.3 Implementar creación y consulta categorizada de jugadas tácticas en `/api/plays` (`OFFENSE`, `DEFENSE`, `DRILL`).

## 3. Módulos de Comunidad, Mesa Técnica y Asistencia

- [x] 3.1 Implementar publicación de noticia fijada en `/api/news`, creación de comentarios por atletas y verificación de bloqueo de comentarios (`commentsLocked`).
- [x] 3.2 Implementar configuración de mesa técnica con bloqueo de acta oficial (`isAnnotatorLocked`) y relevo rápido de turno (`shift-change`) en `/api/events/:id/mesa-tecnica`.
- [x] 3.3 Implementar registro de asistencia y puntualidad en `/api/attendance` con estados `present`, `late` y `absent`.

## 4. Módulo de Seguridad y Feedback

- [x] 4.1 Implementar generación de enlace criptográfico de reseteo de contraseña en `/api/users/:id/reset-link` y envío de ticket de feedback en `/api/feedback`.

## 5. Benchmark de Carga y Concurrencia (Load Testing)

- [x] 5.1 Implementar módulo de benchmark de carga con 25 peticiones concurrentes de lectura y 10 de escritura simultánea, calculando latencias min/max/avg/p95 y tasa de éxito del 100%.
- [x] 5.2 Ejecutar la Mega-Suite v2 completa y el Benchmark de Carga contra el deploy en producción y generar el reporte consolidado.
