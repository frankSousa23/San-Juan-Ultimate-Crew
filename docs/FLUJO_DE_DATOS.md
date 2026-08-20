# 📊 Diagrama de Flujo de Datos y Arquitectura del Sistema (SIGEDIVO)

El **Sistema de Gestión para el Disco Volador (SIGEDIVO)** está estructurado como una arquitectura desacoplada y modular diseñada para alto rendimiento, facilidad de despliegue y máxima adaptabilidad en campo deportivo.

---

## 🏗️ 1. Arquitectura General del Sistema

```
+-----------------------------------------------------------------------------------+
|                              CLIENTES / DISPOSITIVOS                              |
|   [ Navegador Web ]     [ Tablet Mesa Técnica ]     [ Smartphone en Cancha ]      |
+-----------------------------------------------------------------------------------+
                                         │  HTTPS / REST / JSON
                                         ▼
+-----------------------------------------------------------------------------------+
|                        FRONTEND WEB (React 18 + Vite 6)                           |
|  - Router SPA & Guards (ProtectedRoute por Roles)                                 |
|  - Estado Local / Contextos (AuthContext, ToastContext, useApi)                   |
|  - Módulos UI: Roster, Eventos, Pizarra Táctica, Anotaciones, Finanzas, Feedback  |
|  - ErrorBoundary Global & Interceptores HTTP con Inyección de Token JWT           |
+-----------------------------------------------------------------------------------+
                                         │  /api/* (Bearer JWT Token)
                                         ▼
+-----------------------------------------------------------------------------------+
|                        BACKEND API (Node.js + Express)                            |
|  - Middlewares: requireAuth, requireRoles, rateLimiter (Antispam), AuditLogger    |
|  - Controladores y Rutas: /auth, /events, /annotations, /stats, /feedback, etc.   |
|  - Validaciones de Esquema: Zod Schemas                                           |
|  - Capa de Datos / ORM: Prisma Client con Adaptador PostgreSQL                    |
+-----------------------------------------------------------------------------------+
                                         │  SQL / TCP Pool
                                         ▼
+-----------------------------------------------------------------------------------+
|                           BASE DE DATOS (PostgreSQL 16)                           |
|  - Tablas Relacionales: users, players, events, annotations, player_stats, etc.   |
|  - Restricciones de Integridad, Claves Foráneas e Índices de Consulta             |
+-----------------------------------------------------------------------------------+
```

---

## 🔐 2. Flujo de Autenticación, Registro y Aprobación (RBAC)

El sistema implementa un modelo estricto de control de acceso basado en roles (**Role-Based Access Control**), donde los nuevos registros requieren validación para garantizar la integridad comunitaria:

```
[ Usuario ]                [ Frontend ]               [ Backend API ]            [ PostgreSQL ]
     │                           │                           │                          │
     │ 1. Completa Registro ───> │                           │                          │
     │    (Nombre, Email, Rol)   │ 2. POST /api/auth/register│                          │
     │                           │ ────────────────────────> │                          │
     │                           │                           │ 3. Hash Contraseña       │
     │                           │                           │    Crea Usuario PENDING  │
     │                           │                           │ ───────────────────────> │
     │                           │ <── 201 Created ──────────│                          │
     │ <── Mensaje "Pendiente" ──│                           │                          │
     │                           │                           │                          │
     │                           │                           │                          │
[ Administrador ]                │                           │                          │
     │ 4. Ingresa a Admin Users  │                           │                          │
     │ ────────────────────────> │ 5. GET /api/users/pending │                          │
     │                           │ ────────────────────────> │ ───────────────────────> │
     │                           │ <── Lista de Solicitudes ─│ <── Datos ───────────────│
     │ 6. Aprueba / Asigna Rol ─>│                           │                          │
     │                           │ 7. PATCH /api/users/:id   │                          │
     │                           │ ────────────────────────> │ 8. Estado -> APPROVED   │
     │                           │                           │    Asigna Rol & PlayerID │
     │                           │                           │ ───────────────────────> │
     │                           │                           │ 9. Registra AuditLog     │
     │                           │                           │ ───────────────────────> │
```

### Roles y Matriz de Permisos

| Rol | Roster | Eventos / Torneos | Anotaciones en Vivo | Finanzas | Admin Usuarios | Feedback Recibido |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **admin** | Lectura/Escritura | Lectura/Escritura | Lectura/Escritura | Lectura/Escritura | Lectura/Escritura | Lectura/Escritura |
| **captain** | Lectura/Escritura | Lectura/Escritura | Lectura/Escritura | Lectura | No | No |
| **coach** | Lectura/Escritura | Lectura/Escritura | Lectura/Escritura | No | No | No |
| **annotator** | Lectura | Lectura | Lectura/Escritura | No | No | No |
| **treasurer** | Lectura | Lectura | Lectura | Lectura/Escritura | No | No |
| **player** | Lectura (propia edición) | Lectura / Asistencia | Lectura | No | No | No |
| **guest** | Lectura | Lectura | Lectura | No | No | No |

---

## ⏱️ 3. Flujo de Torneos, Partidos y Anotaciones en Vivo

Este es el núcleo deportivo de la plataforma, conectando el flujo desde la planificación de un evento hasta la actualización de estadísticas individuales y colectivas.

```
       [ 1. CREACIÓN DE TORNEO / EVENTO PADRE ]
                         │
                         ▼
       [ 2. CONVOCATORIA Y ASIGNACIÓN DE LÍNEAS ]
       (Definición de O-Line, D-Line y Flex para el Roster)
                         │
                         ▼
       [ 3. PROGRAMACIÓN DE PARTIDOS DERIVADOS ]
       (Categorías: GROUP_STAGE, QUARTER_FINALS, SEMI_FINALS, FINALS)
                         │
                         ▼
       [ 4. INICIO DE PARTIDO EN PISARRA TÁCTIL ]
       (Selección: Modo Torneo vs Rival  O  Modo Scrimmage Interno)
                         │
                         ▼
    ┌────────────────────────────────────────────────────────┐
    │     5. REGISTRO DE ACCIÓN EN CAMPO (Mesa Técnica)      │
    │  - GOL (Anotador + Asistente)                          │
    │  - CALLAHAN / GOL SIN ASISTENCIA                       │
    │  - DEFENSA (D / Intercepción)                          │
    │  - PÉRDIDA (Turnover / Error de pase)                  │
    └────────────────────────────────────────────────────────┘
                         │
                         ▼  POST /api/annotations (Transacción Atómica)
    ┌────────────────────────────────────────────────────────┐
    │     6. PROCESAMIENTO Y ACTUALIZACIÓN EN BACKEND        │
    │  - Inserta registro en tabla 'annotations'             │
    │  - Actualiza marcador del evento (homeScore/awayScore) │
    │  - Incrementa/Ajusta 'player_match_stats' del atleta   │
    │  - Si fue Gol con Asistencia, computa ambos atletas    │
    └────────────────────────────────────────────────────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────────┐
    │     7. IMPACTO INMEDIATO EN TABLAS Y REPORTES          │
    │  - Tabla de Goleadores y Asistidores del Torneo        │
    │  - Gráficos de Rendimiento y Efectividad individual    │
    │  - Registro de Espíritu de Juego (SOTG)                │
    └────────────────────────────────────────────────────────┘
```

---

## 💰 4. Flujo del Módulo de Finanzas y Tesorería

1. **Estructuración de Cuentas:** Se definen Cajas Chicas, Cuentas Bancarias y Monederos.
2. **Registro de Movimientos:** El Tesorero o Administrador registra cada ingreso (cuotas de atletas, patrocinio, inscripciones de torneos) o egreso (alquiler de canchas, hidratación, uniformes, discos oficiales).
3. **Cálculo Dinámico de Balances:** La API calcula en tiempo de ejecución:
   $$\text{Balance Actual} = \text{Saldo Inicial} + \sum \text{Ingresos} - \sum \text{Egresos}$$
4. **Exportación y Auditoría:** Generación de reportes tabulares y registros auditados de cada transacción.

---

## 📬 5. Flujo de Feedback Comunitario y Retroalimentación

1. **Envío de Sugerencia / Reporte:** El usuario (o visitante anónimo) llena el formulario en la sección "Acerca de".
2. **Filtro Antispam (`rateLimiter`):** El backend verifica que no se exceda el límite de 3 envíos por hora por cliente.
3. **Almacenamiento Seguro:** Se guarda en la base de datos vinculado al `userId` (si está autenticado) o de forma anónima con sus datos de contacto.
4. **Bandeja Administrativa Privada:** Únicamente accesible por usuarios con rol `admin` en `/admin/feedback` para evaluar solicitudes, corregir errores reportados e incorporar nuevas sugerencias de la comunidad.
