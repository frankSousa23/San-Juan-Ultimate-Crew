# Workflow de Prueba y Evaluación - SIGEDIVO (Lanzamiento Comunitario)

Este documento describe el flujo de pruebas integral ("End-to-End") diseñado para evaluar SIGEDIVO antes y durante su primer lanzamiento a la comunidad de Ultimate Frisbee.

Para facilitar la evaluación, hemos actualizado el script inicial de la base de datos (`seed.ts`) para que genere automáticamente un ecosistema completo de prueba.

## 👥 1. Escenario Inicial (Datos Pre-Cargados)

Al ejecutar el seeder (`npm run prisma:seed`), el sistema se inicializará con el siguiente escenario pre-configurado:

### Roles y Usuarios
- **Administrador:** `frankalfonso1988@gmail.com` (Acceso total)
- **Invitado / Demo:** `guest@sigedivo.com` (Acceso de solo lectura)
- **Capitanes:** `capitan1@sigedivo.com` (María) y `capitan2@sigedivo.com` (Juan)
- **Coaches / Entrenadores:** `coach1@sigedivo.com` (Pedro) y `coach2@sigedivo.com` (Luis)
- **Atletas Activos (Aprobados):** `jugador1`, `jugador2` y `jugador5`
- **Atletas Pendientes de Aprobación:** `jugador3` (Sofía) y `jugador4` (Miguel)

### Roster Oficial
Los jugadores están asignados a posiciones oficiales de Ultimate: *Handlers*, *Cutters* o *Hybrids*.

### Eventos Creados
- **Evento 1 (Completado):** Entrenamiento Selección O-Line.
- **Evento 2 (Completado):** Partido Amistoso vs. Equipo Rival (Incluye estadísticas de pases, defensas, goles y anotaciones Play-by-play).
- **Evento 3 (Próximo):** Torneo Nacional - Fase de Grupos.

---

## 🧪 2. Flujo de Prueba Paso a Paso (Test Workflow)

Sigue estos pasos dentro de la plataforma para validar que todas las reglas de negocio, permisos y funcionalidades están operando correctamente:

### Fase A: Gestión de Accesos y Permisos
1. **Inicia sesión como Administrador** (`frankalfonso1988@gmail.com`).
2. Dirígete a **Gestión de Roles**. Verifica que los Capitanes y Coaches tengan asignados sus permisos (manejo de roster, asistencia, eventos).
3. Ve a la vista de **Aprobación de Usuarios**. Deberías ver a `jugador3` (Sofía) y `jugador4` (Miguel) en estado `PENDING`.
4. **Acción:** Aprueba a uno y rechaza o mantén pendiente al otro. Comprueba que el usuario aprobado ahora pueda iniciar sesión.

### Fase B: Roster y Perfiles Médicos
1. **Cierra sesión e ingresa como Capitán** (`capitan1@sigedivo.com`).
2. Ve al módulo **Roster**.
3. **Acción:** Edita el perfil de un jugador (ej. cámbiale el dorsal o la posición de Cutter a Handler).
4. **Acción:** Registra una **Lesión** simulada para un jugador activo (ej. "Esguince de tobillo") y colócalo en estado `INJURED`. Verifica que en el Roster se muestre su baja médica.

### Fase C: Creación y Gestión de Eventos
1. Con el rol de **Coach** o **Capitán**, dirígete a **Eventos / Calendario**.
2. **Acción:** Crea un nuevo evento de tipo `TRAINING` (Entrenamiento Táctico). Establece la fecha para mañana.
3. Al crear el evento, añade variables meteorológicas si están disponibles (Ej. Viento cruzado 15 km/h).
4. **Convocatoria (RSVP):** Ingresa con un usuario de tipo **Jugador** (ej. `jugador1@sigedivo.com`) y marca tu asistencia como "Asistiré" (Confirmed) en el evento recién creado.

### Fase D: Estadísticas y Anotaciones (Play-by-play)
1. Ingresa como **Capitán** o **Annotator**.
2. Dirígete al evento **Partido Amistoso vs. Equipo Rival** (que ya está completado).
3. Ve a la pestaña **Estadísticas**.
4. **Validación:** Comprueba que los Goles (Goals), Asistencias (Assists) y Defensas (Ds) concuerden con lo esperado.
5. **Acción:** Añade manualmente una nueva estadística a un jugador (Ej. suma 1 asistencia a un Handler).
6. Ve a la sección **Anotaciones en Vivo**. Crea una anotación de tipo `TURNOVER` (Pérdida) detallando "Pase de drop (caída)".

### Fase E: Espíritu de Juego (SOTG)
1. Como **Capitán**, ve al mismo Partido Amistoso.
2. **Acción:** Registra la puntuación del Espíritu de Juego (SOTG) evaluando al rival. Asigna puntos (0-4) en:
   - Conocimiento y uso de las reglas.
   - Faltas y contacto físico.
   - Imparcialidad (Fair Mindedness).
   - Actitud positiva y autocontrol.
   - Comunicación.
3. Guarda y verifica que el puntaje total se calcule y se almacene correctamente.

### Fase F: Finanzas del Equipo (Caja Chica y Tesorería)
1. Ingresa como **Administrador** (o un rol que posea `finance:manage`).
2. Ve al módulo **Finanzas**.
3. **Validación:** Verifica el balance entre la "Caja Chica" y la "Cuenta Bancaria".
4. **Acción:** Registra un nuevo ingreso (`INCOME`) en la categoría de "Patrocinios y Donaciones". Verifica que el balance general aumente.

### Fase G: Pizarra Táctica (Playbook)
1. Con cualquier usuario (incluso Player), ve a **Pizarra Táctica**.
2. **Acción:** Abre la jugada "Vertical Stack". Visualiza la animación y el desglose de fases en el tablero interactivo.
3. **Acción (Solo Capitán/Coach):** Intenta editar o añadir un nuevo esquema táctico. Verifica que los jugadores regulares no tengan este botón.

---

## ✅ 3. Criterios de Aceptación (Checklist de Éxito)

Para considerar el sistema listo para el **Lanzamiento Comunitario**, se deben cumplir las siguientes condiciones:
- [ ] Los jugadores `PENDING` no tienen acceso a datos sensibles (tácticas, finanzas) hasta ser aprobados.
- [ ] Capitanes y Coaches pueden crear y modificar eventos sin necesidad de intervención del Administrador.
- [ ] El sistema impide que un jugador registre su propia asistencia en un evento del pasado (solo el coach/capitán puede pasar asistencia retrospectiva).
- [ ] Las métricas de Goles y Asistencias se reflejan correctamente en la sumatoria del Dashboard de estadísticas del jugador.
- [ ] Los cálculos del puntaje total de SOTG promedian/suman exactamente los 5 criterios reglamentarios de la WFDF.
- [ ] El simulador táctico carga y permite alternar entre vista interactiva y tabla sin romper la interfaz en dispositivos móviles.

Este entorno de pruebas garantiza que se abarquen el 100% de los flujos críticos antes de la adopción masiva por parte de los atletas.
