# 📊 Diagramas de Flujo Oficiales del Sistema — SIGEDIVO
### Sistema de Gestión para el Disco Volador (San Juan Ultimate Crew)

Este documento unifica y formaliza todos los **diagramas de flujo de trabajo, arquitectura, lógica de negocio y seguridad** de la plataforma SIGEDIVO. Está optimizado para renderizarse automáticamente en GitHub, VS Code, editores Markdown compatibles con Mermaid y en el visualizador HTML interactivo incluido en [`docs/diagramas_flujo_visualizador.html`](./diagramas_flujo_visualizador.html).

---

## 📑 Tabla de Contenidos
1. [Diagrama Maestro Global del Sistema](#1-diagrama-maestro-global-del-sistema)
2. [Flujo de Autenticación, Registro y Aprobación RBAC](#2-flujo-de-autenticación-registro-y-aprobación-rbac)
3. [Flujo Core Deportivo: Torneos, Convocatorias y Anotaciones en Vivo](#3-flujo-core-deportivo-torneos-convocatorias-y-anotaciones-en-vivo)
4. [Flujo de Fusión de Jugador Invitado a Jugador Oficial](#4-flujo-de-fusión-de-jugador-invitado-a-jugador-oficial-merge-guest)
5. [Flujo del Módulo Contable y Financiero (Tesorería)](#5-flujo-del-módulo-contable-y-financiero-tesorería)
6. [Flujo de Control Médico y Estado de Lesiones](#6-flujo-de-control-médico-y-estado-de-lesiones)
7. [Matriz de Permisos y Control de Acceso por Roles (RBAC)](#7-matriz-de-permisos-y-control-de-acceso-por-roles-rbac)
8. [Cómo Visualizar y Exportar estos Diagramas](#8-cómo-visualizar-y-exportar-estos-diagramas)

---

## 1. Diagrama Maestro Global del Sistema

Representa el recorrido integral de la plataforma, desde el acceso multidispositivo hasta la persistencia en base de datos y generación de analítica en tiempo real.

```mermaid
flowchart TD
    %% Estilos Globales
    classDef userLayer fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef frontLayer fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef backLayer fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef dbLayer fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef decision fill:#3b0764,stroke:#f43f5e,stroke-width:2px,color:#fff;

    subgraph CLIENTES ["📱 CAPA DE CLIENTES Y DISPOSITIVOS"]
        A1["Navegador Web (Admin / Directiva)"]:::userLayer
        A2["Tablet / Móvil (Mesa Técnica en Cancha)"]:::userLayer
        A3["Smartphone (Atletas / Coaches / Invitados)"]:::userLayer
    end

    subgraph FRONTEND ["⚡ FRONTEND (React 18 + Vite 6 + Tailwind)"]
        B1["Página de Inicio / Landing"]:::frontLayer
        B2{"¿Tiene Cuenta?"}:::decision
        B3["Formulario Registro (/register)"]:::frontLayer
        B4["Formulario Login (/login)"]:::frontLayer
        B5["Modo Demo / Invitado (1-Clic)"]:::frontLayer
        B6["Guard de Rutas & AuthContext (JWT + Rol)"]:::frontLayer
        B7["Panel Principal (Dashboard General)"]:::frontLayer
    end

    subgraph MODULOS ["🥏 MÓDULOS DE NEGOCIO"]
        C1["🏃 Roster & Perfiles"]:::frontLayer
        C2["📅 Eventos & Torneos"]:::frontLayer
        C3["⏱️ Pizarra Táctica en Vivo"]:::frontLayer
        C4["📈 Analytics & Estadísticas"]:::frontLayer
        C5["🏥 Control de Lesiones"]:::frontLayer
        C6["💰 Tesorería & Finanzas"]:::frontLayer
        C7["📋 Playbook & Scouting"]:::frontLayer
        C8["⚙️ Admin Usuarios & Equipos"]:::frontLayer
    end

    subgraph BACKEND ["🛡️ BACKEND API (Node.js + Express + Prisma)"]
        D1["Middlewares (RateLimit, CORS, Helmet)"]:::backLayer
        D2["JWT Auth & Verificación de Permisos (RBAC)"]:::backLayer
        D3["Scoping de Consultas por Equipo (teamId)"]:::backLayer
        D4["Controladores & Validaciones (Zod Schemas)"]:::backLayer
        D5["AuditLogger & Transacciones Atómicas"]:::backLayer
    end

    subgraph DB ["💾 BASE DE DATOS (PostgreSQL 16)"]
        E1[(Usuarios & Roles)]:::dbLayer
        E2[(Equipos & Roster)]:::dbLayer
        E3[(Eventos, Convocatorias & Asistencias)]:::dbLayer
        E4[(Anotaciones & Estadísticas de Partido)]:::dbLayer
        E5[(Cuentas & Transacciones Financieras)]:::dbLayer
        E6[(Historial Médico & Auditoría)]:::dbLayer
    end

    %% Conexiones
    A1 & A2 & A3 --> B1
    B1 --> B2
    B2 -- "No" --> B3
    B2 -- "Sí" --> B4
    B2 -- "Explorar" --> B5
    B3 --> B4
    B4 & B5 --> B6
    B6 --> B7

    B7 --> C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8

    C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 --> D1
    D1 --> D2 --> D3 --> D4 --> D5

    D5 --> E1 & E2 & E3 & E4 & E5 & E6
```

---

## 2. Flujo de Autenticación, Registro y Aprobación RBAC

El sistema garantiza la seguridad comunitaria mediante aprobación obligatoria de nuevos atletas antes de habilitar permisos de escritura o acceso a datos privados del equipo:

```mermaid
sequenceDiagram
    autonumber
    actor U as Atleta / Usuario
    participant FE as Frontend (/register)
    participant API as Backend Express API
    participant DB as PostgreSQL
    actor ADM as Administrador / Directiva

    U->>FE: Ingresa Datos (Nombre, Email, Password, Equipo)
    FE->>API: POST /api/auth/register
    API->>API: Valida formato, hashea contraseña (bcrypt)
    API->>DB: INSERT User (status: 'PENDING', teamId)
    DB-->>API: Usuario Creado
    API-->>FE: 201 Created ("Cuenta en espera de aprobación")
    FE-->>U: Muestra pantalla de espera

    Note over ADM, API: Notificación a la Directiva
    ADM->>FE: Accede a /admin/usuarios
    FE->>API: GET /api/users/pending
    API->>DB: SELECT * FROM users WHERE status = 'PENDING'
    DB-->>API: Lista de solicitudes
    API-->>FE: Muestra lista interactiva

    ADM->>FE: Aprueba solicitud, asigna Rol (Player, Captain, Coach, etc.)
    FE->>API: PATCH /api/users/:id/approve (role, teamId, dorsal)
    API->>DB: Actualiza User (status: 'APPROVED', role)
    API->>DB: Crea o enlaza registro en tabla 'Player' (Roster)
    API->>DB: Registra evento en 'AuditLog'
    API-->>FE: 200 OK (Aprobado exitosamente)

    Note over U, API: Inicio de Sesión
    U->>FE: Inicia Sesión en /login
    FE->>API: POST /api/auth/login (email, password)
    API->>DB: Verifica credenciales y estado ('APPROVED')
    API-->>FE: 200 OK + JWT Token (payload: userId, role, teamId, playerId)
    FE->>FE: Almacena Token & Contexto -> Redirige a Dashboard
```

---

## 3. Flujo Core Deportivo: Torneos, Convocatorias y Anotaciones en Vivo

Módulo central para la gestión del partido desde la mesa técnica con sincronización atómica de estadísticas:

```mermaid
flowchart TD
    classDef stage fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef action fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef backend fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef decision fill:#4c0519,stroke:#f43f5e,stroke-width:2px,color:#fff;

    subgraph FASE1 ["1. PLANIFICACIÓN Y CONVOCATORIA"]
        P1["Creación de Evento / Torneo Padre"]:::stage
        P2["Convocatoria de Atletas"]:::stage
        P3["Asignación de Líneas Tácticas: O-Line / D-Line / Flex"]:::stage
        P4["Registro de Asistencia (Presente / Tarde / Ausente)"]:::stage
        P1 --> P2 --> P3 --> P4
    end

    subgraph FASE2 ["2. PROGRAMACIÓN DE PARTIDO"]
        M1["Programar Partido Derivado"]:::stage
        M2{"Tipo de Partido"}:::decision
        M3["Modo Torneo Oficial (vs Equipo Rival)"]:::stage
        M4["Modo Caimanera Interno (Claro vs Oscuro)"]:::stage
        P4 --> M1 --> M2
        M2 -- "Oficial" --> M3
        M2 -- "Práctica" --> M4
    end

    subgraph FASE3 ["3. MESA TÉCNICA - PIZARRA TÁCTIL EN VIVO"]
        A0["Inicio del Partido (/anotaciones)"]:::stage
        A1{"¿Qué acción ocurrió?"}:::decision
        
        A2["⚽ GOL REGULAR<br/>Selecciona Anotador + Asistente"]:::action
        A3["⚡ CALLAHAN / ERROR RIVAL<br/>Gol Directo (1 toque)"]:::action
        A4["🛡️ DEFENSA (D)<br/>Intercepción de Disco"]:::action
        A5["❌ PÉRDIDA (Turnover)<br/>Pase caído / Fuera de línea"]:::action

        M3 & M4 --> A0 --> A1
        A1 --> A2 & A3 & A4 & A5
    end

    subgraph FASE4 ["4. PROCESAMIENTO ATÓMICO EN BACKEND"]
        B1["POST /api/annotations"]:::backend
        B2["1. Inserta registro en EventAnnotation"]:::backend
        B3["2. Recalcula marcador (HomeScore / AwayScore)"]:::backend
        B4["3. Actualiza PlayerMatchStats (Goles, Asistencias, +/-)"]:::backend
        B5["4. Emite respuesta y sincroniza UI en tiempo real"]:::backend

        A2 & A3 & A4 & A5 --> B1
        B1 --> B2 --> B3 --> B4 --> B5
    end

    subgraph FASE5 ["5. ANALYTICS & IMPACTO INMEDIATO"]
        R1["📊 Tabla de Goleadores y Asistidores"]:::stage
        R2["📈 Gráfico de Rendimiento (+/- Plus/Minus)"]:::stage
        R3["🌟 Evaluación de Espíritu de Juego (SOTG)"]:::stage

        B5 --> R1 & R2 & R3
    end
```

---

## 4. Flujo de Fusión de Jugador Invitado a Jugador Oficial (Merge Guest)

Permite recopilar datos durante caimaneras abiertas sin perder el historial al momento de la incorporación formal:

```mermaid
flowchart LR
    classDef temp fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef proc fill:#1e1b4b,stroke:#8b5cf6,stroke-width:2px,color:#fff;
    classDef done fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;

    subgraph CAMPO ["1. Durante la Caimanera"]
        T1["Mesa Técnica crea Jugador Temporal (RivalPlayer)"]:::temp
        T2["Se registran Goles y Asistencias con rivalPlayerId"]:::temp
        T1 --> T2
    end

    subgraph REGISTRO ["2. Registro Formal"]
        R1["El jugador se registra en el sistema"]:::proc
        R2["Admin aprueba y crea Player Oficial (playerId)"]:::proc
        T2 --> R1 --> R2
    end

    subgraph MERGE ["3. Transacción Atómica de Fusión"]
        M1["POST /api/players/:id/merge-guest"]:::proc
        M2["Busca anotaciones con rivalPlayerId"]:::proc
        M3["Transfiere autoría a playerId (isRefuerzo: true)"]:::proc
        M4["Elimina el perfil temporal de RivalPlayer"]:::proc
        R2 --> M1 --> M2 --> M3 --> M4
    end

    subgraph FINAL ["4. Resultado"]
        F1["Historial estadístico migrado al 100% sin pérdida de datos"]:::done
        M4 --> F1
    end
```

---

## 5. Flujo del Módulo Contable y Financiero (Tesorería)

Registro auditable de ingresos, egresos y transferencias con cálculo en tiempo real:

```mermaid
flowchart TD
    classDef fin fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef trans fill:#1e293b,stroke:#60a5fa,stroke-width:2px,color:#fff;
    classDef math fill:#312e81,stroke:#a78bfa,stroke-width:2px,color:#fff;

    A["Estructuración de Cuentas (Caja Chica, Banco, Pago Móvil)"]:::fin
    
    B{"Registro de Movimiento"}:::trans
    B1["🟢 INGRESO (Mensualidades, Patrocinio, Bid Fees)"]:::trans
    B2["🔴 EGRESO (Alquiler Canchas, Hidratación, Uniformes, Discos)"]:::trans
    B3["🔄 TRANSFERENCIA (Entre cuentas del club)"]:::trans

    A --> B
    B --> B1 & B2 & B3

    C["POST /api/transactions"]:::math
    B1 & B2 & B3 --> C

    D["Cálculo Dinámico de Balances en Tiempo Real:<br/><b>Balance = Saldo Inicial + Σ Ingresos - Σ Egresos</b>"]:::math
    C --> D

    E1["📊 Dashboard Financiero"]:::fin
    E2["📋 Libro Diario / Auditoría"]:::fin
    E3["📄 Exportación de Reportes"]:::fin

    D --> E1 & E2 & E3
```

---

## 6. Flujo de Control Médico y Estado de Lesiones

```mermaid
stateDiagram-v2
    [*] --> Activo : Atleta en Roster Oficial

    Activo --> Lesionado : Reporte de Incidente Médico\n(POST /api/injuries)
    
    state Lesionado {
        [*] --> ACTIVA : Diagnóstico inicial (Leve, Moderada, Severa)
        ACTIVA --> EN_RECUPERACION : Inicio de Fisioterapia / Reposo
        EN_RECUPERACION --> RESUELTA : Alta médica y acondicionamiento
    }

    Lesionado --> Activo : Se marca estado 'RESOLVED'\n(El atleta regresa a la rotación)
```

---

## 7. Matriz de Permisos y Control de Acceso por Roles (RBAC)

| Módulo del Sistema | Admin | Directiva | Captain | Coach | Annotator | Treasurer | Player | Guest |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Roster & Jugadores** | ✏️ Total | ✏️ Total | ✏️ Total | ✏️ Total | 👁️ Lectura | 👁️ Lectura | ✏️ Propio | 👁️ Lectura |
| **Eventos & Torneos** | ✏️ Total | ✏️ Total | ✏️ Total | ✏️ Total | 👁️ Lectura | 👁️ Lectura | 🙋 RSVP | 👁️ Lectura |
| **Pizarra de Anotaciones** | ✏️ Total | ✏️ Total | ✏️ Total | ✏️ Total | ✏️ Total | 👁️ Lectura | 👁️ Lectura | 👁️ Lectura |
| **Finanzas & Tesorería** | ✏️ Total | ✏️ Total | 👁️ Lectura | ❌ | ❌ | ✏️ Total | ❌ | ❌ |
| **Historial Médico** | ✏️ Total | ✏️ Total | ✏️ Total | ✏️ Total | ❌ | ❌ | 👁️ Propio | 👁️ Lectura |
| **Gestión de Equipos** | ✏️ Total | ✏️ Total | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Administración Usuarios**| ✏️ Total | ✏️ Total | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Feedback Comunitario** | ✏️ Total | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 8. Cómo Visualizar y Exportar estos Diagramas

Tienes 3 formas inmediatas de usar y compartir estos diagramas:

1. **Visualizador Interactivo Local (Recomendado):** Abre en tu navegador el archivo [`docs/diagramas_flujo_visualizador.html`](./diagramas_flujo_visualizador.html). Te permite ver los diagramas con zoom, alternar modo claro/oscuro e imprimir/exportar a PDF.
2. **Visualización en GitHub / GitLab:** Al subir este archivo a tu repositorio, GitHub renderiza de forma nativa todos los bloques `mermaid`.
3. **Editor en Línea (Mermaid Live Editor):** Puedes copiar cualquier bloque de código y pegarlo en [https://mermaid.live](https://mermaid.live) para exportar directamente a formato PNG, SVG o Vectorial.
