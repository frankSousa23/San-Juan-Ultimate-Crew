# Workflow de Prueba y Evaluación - SIGEDIVO (Lanzamiento Comunitario)

Este documento describe el flujo de pruebas integral ("End-to-End") diseñado para evaluar SIGEDIVO antes y durante su operación en la comunidad de Ultimate Frisbee.

Para facilitar la evaluación, el sistema cuenta con:
1. Un **script de verificación en vivo** (`npx tsx scripts/run-live-deploy-tests.ts`) que ejecuta 34 pruebas continuas y benchmarks de estrés contra el deploy en producción.
2. Un **script de inicialización local** (`seed.ts`) que genera un ecosistema pre-configurado para pruebas manuales.

---

## 👥 1. Escenario Inicial (Datos Pre-Cargados)

Al ejecutar el seeder (`npm run prisma:seed`), el sistema se inicializa con el siguiente escenario pre-configurado:

### Roles y Usuarios
- **Super Administrador:** `frankalfonso1988@gmail.com` (Acceso total)
- **Invitado / Demo:** `guest@sigedivo.com` (Acceso de demostración)
- **Capitanes:** `capitan1@sigedivo.com` (María) y `capitan2@sigedivo.com` (Juan)
- **Coaches / Entrenadores:** `coach1@sigedivo.com` (Pedro) y `coach2@sigedivo.com` (Luis)
- **Anotadores Oficiales:** `anotador1@sigedivo.com` (Mesa Técnica)
- **Tesorería / Finanzas:** `tesorero@sigedivo.com` (Control contable)
- **Atletas Activos (Aprobados):** `jugador1`, `jugador2` y `jugador5`
- **Atletas Pendientes de Aprobación:** `jugador3` (Sofía) y `jugador4` (Miguel)

### Roster Oficial y Multi-Equipo
Los jugadores están divididos entre equipos (*San Juan Ultimate Crew - Open*, *San Juan Ultimate Crew - Femenino*) y asignados a posiciones oficiales de Ultimate: *Handlers*, *Cutters* o *Hybrids*.

### Eventos Creados
- **Evento 1 (Completado):** Entrenamiento Selección O-Line.
- **Evento 2 (Completado):** Partido Amistoso vs. Equipo Rival (Incluye estadísticas de pases, defensas, goles y anotaciones Play-by-play).
- **Evento 3 (Próximo):** Torneo Nacional - Fase de Grupos.
- **Evento 4 (Caimanera):** Caimanera Mixta de Integración Comunitaria.

---

## 🧪 2. Flujo de Prueba Paso a Paso (Test Workflow Manual)

Sigue estos pasos dentro de la plataforma para validar que todas las reglas de negocio, permisos y funcionalidades están operando correctamente:

### Fase A: Gestión de Accesos y Permisos (RBAC)
1. **Inicia sesión como Administrador** (`frankalfonso1988@gmail.com`).
2. Dirígete a **Gestión de Roles**. Verifica que los Capitanes y Coaches tengan asignados sus permisos (manejo de roster, asistencia, eventos).
3. Ve a la vista de **Aprobación de Usuarios** (`/admin/usuarios`). Deberías ver a los usuarios en estado `PENDING`.
4. **Acción:** Aprueba a un usuario, asígnale equipo y rol. Comprueba que el usuario aprobado ahora pueda iniciar sesión.

### Fase B: Roster y Perfiles Médicos
1. **Cierra sesión e ingresa como Capitán** (`capitan1@sigedivo.com`).
2. Ve al módulo **Roster**.
3. **Acción:** Edita el perfil de un jugador (ej. cámbiale el dorsal o la posición de Cutter a Handler).
4. **Acción:** Registra una **Lesión** simulada para un jugador activo (ej. "Esguince de tobillo") y colócalo en estado `INJURED`. Verifica que en el Roster se muestre su baja médica.

### Fase C: Creación y Gestión de Eventos con Plantillas
1. Con el rol de **Coach** o **Capitán**, dirígete a **Eventos / Calendario**.
2. **Acción:** Pulsa el botón **"+ Crear Evento"**.
3. **Validación de Plantillas:** Haz clic en los botones de categoría rápida (*Torneo Open Masc/Fem, Full Day Open/Mixto, Amistoso Interclub, Caimanera Interna*). Verifica que el título y la configuración se autocompleten limpiamente.
4. **Validación de Fondo Modal:** Haz clic en los selectores, arrastra el ratón o interactúa con las opciones del formulario. Comprueba que el modal no se cierre accidentalmente.
5. Al crear el evento, añade variables meteorológicas si están disponibles (Ej. Viento cruzado 15 km/h).
6. **Convocatoria (RSVP):** Ingresa con un usuario de tipo **Jugador** (ej. `jugador1@sigedivo.com`) y marca tu asistencia como "Asistiré" (Confirmed) en el evento recién creado.

### Fase D: Mesa Técnica y Anotaciones en Vivo (Play-by-play)
1. Ingresa como **Capitán** o **Annotator** (`anotador1@sigedivo.com`).
2. Dirígete a un partido en vivo o en curso.
3. Ve a la sección **Anotaciones en Vivo** (`/eventos/:id/anotaciones`).
4. **Validación:** Comprueba que el marcador gigante superior se mantenga sticky y legible.
5. **Acción de Gol:** Registra un gol seleccionando al anotador y al asistente (`relatedPlayerId`). Verifica que el marcador aumente inmediatamente.
6. **Acción Rápida:** Usa el botón de 1 toque "Sin Asistencia / Callahan / Error Rival".
7. **Acción de Pérdida:** Registra un `TURNOVER` detallando la causa (ej. "Pase incompleto / Drop").

### Fase E: Espíritu de Juego (SOTG) y Círculo de Espíritu
1. Como **Capitán**, ve al partido completado.
2. **Acción:** Registra la puntuación del Espíritu de Juego (SOTG) evaluando al rival. Asigna puntos (0-4) en:
   - Conocimiento y uso de las reglas.
   - Faltas y contacto físico.
   - Imparcialidad (Fair Mindedness).
   - Actitud positiva y autocontrol.
   - Comunicación constructiva.
3. Guarda y verifica que el puntaje total se calcule y se almacene correctamente sobre 20 puntos.

### Fase F: Finanzas del Equipo (Caja Chica y Tesorería)
1. Ingresa como **Administrador** o **Tesorero** (`tesorero@sigedivo.com`).
2. Ve al módulo **Finanzas**.
3. **Validación:** Verifica el balance entre la "Caja Chica" y la "Cuenta Bancaria".
4. **Acción:** Registra un nuevo ingreso (`INCOME`) en la categoría de "Inscripción a Torneo". Verifica que el balance general aumente en tiempo real.

### Fase G: Pizarra Táctica (Playbook) y Documentación PDF
1. Ve a **Pizarra Táctica** y visualiza las formaciones oficiales (*Vertical Stack*, *Horizontal Stack*, *Defensa Zona Cup*).
2. Ve a **Recursos y Documentación** (`/recursos`).
3. **Acción:** Haz clic en **"Descargar Manual Maestro en PDF"** y en las guías técnicas individuales (Reglas WFDF, Rúbrica SOTG, Señales de Mano). Verifica que el PDF generado se descargue con diseño limpio y sin errores.

---

## ⚡ 3. Ejecución Automatizada del Test Runner en Vivo (Ultra-Suite E2E)

Para ejecutar la verificación completa de forma autónoma contra el despliegue en producción (`https://san-juan-ultimate-crew.seenode.app`):

```bash
# Ejecutar los 34 casos de prueba y benchmarks de concurrencia
npx tsx scripts/run-live-deploy-tests.ts
```

Este script automatizado cubre:
- Generación de usuarios aleatorios multi-rol y multi-equipo en caliente.
- Asignación dinámica de dorsales sin colisiones.
- Validación de reglas de negocio RBAC y transaccionalidad bancaria.
- Stress testing con 50 lecturas concurrentes simultáneas y 20 escrituras en ráfaga.

---

## ✅ 4. Criterios de Aceptación (Checklist de Éxito)

Para considerar el sistema 100% operativo se deben cumplir las siguientes condiciones:
- [x] Los jugadores `PENDING` no tienen acceso a datos sensibles (tácticas, finanzas) hasta ser aprobados.
- [x] Capitanes y Coaches pueden crear y modificar eventos usando plantillas de categorías sin cierres accidentales de modal.
- [x] El aislamiento multi-equipo restringe el acceso de usuarios al equipo asignado.
- [x] Las métricas de Goles y Asistencias se reflejan inmediatamente en la sumatoria del Dashboard y Roster.
- [x] Los cálculos de SOTG promedian exactamente los 5 criterios reglamentarios de la WFDF.
- [x] El generador de PDF produce documentos con tipografía clara y membretes oficiales.
- [x] La suite E2E en producción aprueba el 100% de los 34 casos de prueba bajo concurrencia.
