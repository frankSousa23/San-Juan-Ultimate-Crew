# 📚 API Documentation - San Juan Ultimate Crew

## 🌐 Base URL
```
http://localhost:4000
```

## 🔐 Authentication

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Endpoints

#### POST /api/auth/login
Login de usuario
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin"
  }
}
```

#### POST /api/auth/register
Registro de nuevo usuario
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Usuario"
}
```

#### GET /api/auth/me
Obtener información del usuario actual
**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin",
    "roles": ["admin"],
    "playerId": null
  }
}
```

#### POST /api/auth/logout
Logout (stateless)

## 🏥 Health Check

### GET /health
Health check básico
**Response:**
```json
{
  "ok": true,
  "time": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development"
}
```

### GET /health/db
Health check de base de datos
**Response:**
```json
{
  "ok": true,
  "database": "connected",
  "responseTime": "15ms",
  "counts": {
    "players": 8,
    "events": 2,
    "users": 3,
    "transactions": 2
  }
}
```

### GET /health/system
Health check del sistema
**Response:**
```json
{
  "ok": true,
  "system": {
    "uptime": 3600,
    "memory": {
      "rss": "45MB",
      "heapTotal": "20MB",
      "heapUsed": "15MB",
      "external": "2MB"
    },
    "nodeVersion": "v18.17.0",
    "platform": "win32",
    "arch": "x64"
  }
}
```

## 👥 Players

### GET /api/players
Obtener lista de jugadores
**Response:**
```json
[
  {
    "id": 1,
    "name": "Juan Martínez",
    "number": 7,
    "position": "HANDLER",
    "status": "ACTIVE",
    "heightCm": 178,
    "experience": "3 años",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

### POST /api/players
Crear nuevo jugador (Admin only)
```json
{
  "name": "Nuevo Jugador",
  "number": 99,
  "position": "CUTTER",
  "status": "ACTIVE",
  "heightCm": 175,
  "experience": "1 año"
}
```

### PUT /api/players/:id
Actualizar jugador (Admin o el mismo jugador)
```json
{
  "name": "Nombre Actualizado",
  "status": "INJURED"
}
```

### DELETE /api/players/:id
Eliminar jugador (Admin only)

## 📅 Events

### GET /api/events
Obtener lista de eventos
**Response:**
```json
[
  {
    "id": 1,
    "title": "Entrenamiento",
    "description": "Entrenamiento semanal",
    "type": "TRAINING",
    "status": "UPCOMING",
    "location": "Campo Central",
    "startsAt": "2025-01-20T18:00:00.000Z",
    "endsAt": "2025-01-20T20:00:00.000Z",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
]
```

### POST /api/events
Crear nuevo evento
```json
{
  "title": "Nuevo Evento",
  "description": "Descripción del evento",
  "type": "TOURNAMENT",
  "status": "UPCOMING",
  "location": "Estadio Principal",
  "startsAt": "2025-01-25T10:00:00.000Z",
  "endsAt": "2025-01-25T18:00:00.000Z"
}
```

### PUT /api/events/:id
Actualizar evento
### DELETE /api/events/:id
Eliminar evento

## 💰 Finances

### GET /api/accounts
Obtener cuentas
### POST /api/accounts
Crear cuenta (Admin only)
### DELETE /api/accounts/:id
Eliminar cuenta (Admin only)

### GET /api/categories
Obtener categorías
### POST /api/categories
Crear categoría (Admin only)
### DELETE /api/categories/:id
Eliminar categoría (Admin only)

### GET /api/transactions
Obtener transacciones con filtros
**Query Parameters:**
- `from`: Fecha inicio (ISO string)
- `to`: Fecha fin (ISO string)
- `type`: INCOME, EXPENSE, TRANSFER
- `accountId`: ID de cuenta
- `categoryId`: ID de categoría
- `limit`: Límite de resultados (default: 20)
- `offset`: Offset para paginación

### POST /api/transactions
Crear transacción (Admin only)
```json
{
  "accountId": 1,
  "categoryId": 1,
  "type": "INCOME",
  "amountCents": 5000,
  "occurredAt": "2025-01-15T10:30:00.000Z",
  "description": "Cuota mensual"
}
```

### GET /api/transactions/summary/overall
Resumen financiero
**Response:**
```json
{
  "income": 10000,
  "expense": 3000,
  "balance": 7000
}
```

## 📁 Resources

### GET /api/resources
Obtener recursos con filtros
**Query Parameters:**
- `q`: Búsqueda por texto
- `category`: Filtro por categoría

### GET /api/resources/paged
Obtener recursos paginados
**Query Parameters:**
- `q`: Búsqueda por texto
- `category`: Filtro por categoría
- `limit`: Límite (1-200, default: 20)
- `offset`: Offset
- `order`: createdAtDesc o titleAsc

### GET /api/resources/categories
Obtener categorías disponibles

### GET /api/resources/export
Exportar recursos a CSV

### POST /api/resources
Crear recurso (Admin only)
```json
{
  "title": "Documento Importante",
  "description": "Descripción del documento",
  "url": "https://example.com/doc.pdf",
  "category": "Documentos"
}
```

### POST /api/resources/upload
Subir archivo (Admin only)
**Content-Type:** multipart/form-data
**Fields:**
- `file`: Archivo (PDF, PNG, JPEG, GIF, TXT, máx 10MB)
- `title`: Título (opcional)
- `description`: Descripción (opcional)
- `category`: Categoría (opcional)

### PUT /api/resources/:id
Actualizar recurso (Admin only)
### DELETE /api/resources/:id
Eliminar recurso (Admin only)
### POST /api/resources/bulk-delete
Eliminar múltiples recursos (Admin only)
```json
{
  "ids": [1, 2, 3]
}
```

## 👤 Users & Roles

### GET /api/users
Listar usuarios (Admin only)
### PUT /api/users/:id/roles
Asignar roles (Admin only)
### PUT /api/users/:id/link-player
Vincular usuario con jugador (Admin only)

### GET /api/users/role-requests
Listar solicitudes de rol (Admin only)
### POST /api/users/role-requests
Crear solicitud de rol
### POST /api/users/role-requests/:id/approve
Aprobar solicitud (Admin only)
### POST /api/users/role-requests/:id/deny
Denegar solicitud (Admin only)
### PUT /api/users/role-requests/:id
Actualizar solicitud (Admin only)

## 📊 Statistics

### GET /api/stats
Estadísticas generales
**Response:**
```json
{
  "totals": {
    "players": 8,
    "events": 2,
    "transactions": 2
  },
  "upcomingEvents": [...],
  "attendanceByStatus": {...},
  "eventsByType": {...}
}
```

## 🚨 Error Responses

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "issues": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

### Forbidden (403)
```json
{
  "error": "Forbidden"
}
```

### Not Found (404)
```json
{
  "error": "Resource not found"
}
```

### Conflict (409)
```json
{
  "error": "Resource already exists"
}
```

### Internal Server Error (500)
```json
{
  "error": "Internal Server Error"
}
```

## 🔒 Rate Limiting

- **General**: 100 requests per 15 minutes
- **Auth**: 5 requests per 15 minutes
- **Upload**: 10 requests per minute

## 📝 Notes

- Todos los timestamps están en formato ISO 8601
- Los montos se almacenan en centavos (amountCents)
- La autenticación es opcional (AUTH_REQUIRED=false por defecto)
- Los archivos subidos se sirven en `/uploads/<filename>`
- El CORS está configurado para localhost:5173 y localhost:5176
