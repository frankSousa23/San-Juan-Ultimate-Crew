import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'San Juan Ultimate Crew — API Oficial del Disco Volador',
      version: '1.0.0',
      description: 'API REST para la gestión deportiva, estadísticas en vivo, pizarra táctica de torneos, finanzas y administración de clubes de Ultimate Frisbee / Disco Volador.\n\n**Autor:** Frank Sousa (`frankSousa23`) — San Juan de los Morros, Estado Guárico, Venezuela.\n**Impulsando:** Asociación Guariqueña del Disco Volador (AGDV) | En apoyo a la Federación del Disco Volador de Venezuela (FDVV) y la Asociación Aragüeña del Disco Volador (AADV).',
      contact: {
        name: 'Frank Sousa (San Juan Ultimate Crew)',
        url: 'https://github.com/frankSousa23/San-Juan-Ultimate-Crew',
      },
      license: {
        name: 'MIT Open Source License (con atribución requerida)',
        url: 'https://github.com/frankSousa23/San-Juan-Ultimate-Crew/blob/main/LICENSE',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Servidor Local de Desarrollo',
      },
      ...(env.NODE_ENV === 'production' && process.env.API_URL
        ? [
            {
              url: process.env.API_URL,
              description: 'Servidor de Producción en la Nube',
            },
          ]
        : []),
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido mediante /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error descriptivo',
            },
          },
        },
        Player: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            number: { type: 'integer', description: 'Número de dorsal único' },
            position: { type: 'string', enum: ['HANDLER', 'CUTTER', 'HYBRID'] },
            status: { type: 'string', enum: ['ACTIVE', 'INJURED', 'INACTIVE'] },
            heightCm: { type: 'integer', nullable: true },
            experience: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['TRAINING', 'TOURNAMENT', 'SOCIAL', 'WORKSHOP', 'FULL_DAY_OPEN', 'FULL_DAY_MIXTO', 'AMISTOSO'] },
            status: { type: 'string', enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
            location: { type: 'string', nullable: true },
            parentId: { type: 'integer', nullable: true, description: 'ID de Torneo Padre en caso de ser partido vinculado' },
            matchCategory: { type: 'string', nullable: true, description: 'Categoría de fase de torneo (GROUP_STAGE, QUARTER_FINALS, SEMI_FINALS, FINALS)' },
            isInternalScrimmage: { type: 'boolean', nullable: true, description: 'True si es partido interno Claro vs Oscuro' },
            rivalId: { type: 'integer', nullable: true },
            startsAt: { type: 'string', format: 'date-time' },
            endsAt: { type: 'string', format: 'date-time', nullable: true },
            windSpeed: { type: 'integer', nullable: true },
            windDirection: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        EventAnnotation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            eventId: { type: 'integer' },
            playerId: { type: 'integer', nullable: true },
            relatedPlayerId: { type: 'integer', nullable: true, description: 'ID del jugador asistente en jugada de gol' },
            type: { type: 'string', enum: ['GOAL', 'ASSIST', 'DEFENSE', 'TURNOVER'] },
            lineType: { type: 'string', nullable: true, description: 'O-Line, D-Line o Flex' },
            teamSide: { type: 'string', enum: ['HOME', 'AWAY'], nullable: true },
            scoreHome: { type: 'integer', nullable: true },
            scoreAway: { type: 'integer', nullable: true },
            opponentTeamName: { type: 'string', nullable: true },
            opponentPlayerName: { type: 'string', nullable: true },
            opponentPlayerNumber: { type: 'integer', nullable: true },
            note: { type: 'string', nullable: true },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            accountId: { type: 'integer' },
            categoryId: { type: 'integer', nullable: true },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE', 'TRANSFER'] },
            amountCents: { type: 'integer', description: 'Monto exacto en centavos' },
            occurredAt: { type: 'string', format: 'date-time' },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            name: { type: 'string', nullable: true },
            playerId: { type: 'integer', nullable: true },
            status: { 
              type: 'string', 
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
              description: 'Estado de la cuenta de usuario'
            },
            roles: {
              type: 'array',
              items: { type: 'string', enum: ['admin', 'captain', 'coach', 'treasurer', 'player', 'guest'] },
              description: 'Roles asignados al usuario en la matriz RBAC',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['CASH', 'BANK', 'MOBILE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            kind: { type: 'string', enum: ['INCOME', 'EXPENSE', 'TRANSFER'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Injury: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            playerId: { type: 'integer' },
            type: { type: 'string' },
            severity: { type: 'string', enum: ['MILD', 'MODERATE', 'SEVERE'] },
            status: { type: 'string', enum: ['ACTIVE', 'RECOVERING', 'RESOLVED'], nullable: true },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            player: { $ref: '#/components/schemas/Player' },
          },
        },
        Play: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            category: { type: 'string', enum: ['OFFENSE', 'DEFENSE', 'DRILL'] },
            description: { type: 'string', nullable: true },
            diagramUrl: { type: 'string', format: 'uri', nullable: true },
            content: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Attendance: {
          type: 'object',
          properties: {
            eventId: { type: 'integer' },
            playerId: { type: 'integer' },
            status: { type: 'string', enum: ['present', 'absent', 'late'] },
            note: { type: 'string', nullable: true },
            player: { $ref: '#/components/schemas/Player' },
          },
        },
        Channel: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            eventId: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        EventParticipant: {
          type: 'object',
          properties: {
            eventId: { type: 'integer' },
            playerId: { type: 'integer' },
            role: { type: 'string', nullable: true },
            lineType: { type: 'string', nullable: true, description: 'O-Line, D-Line o Flex' },
            status: { type: 'string', nullable: true },
            player: { $ref: '#/components/schemas/Player' },
            event: { $ref: '#/components/schemas/Event' },
          },
        },
        Rival: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            strengths: { type: 'string', nullable: true },
            weaknesses: { type: 'string', nullable: true },
            lastPlayedAt: { type: 'string', format: 'date-time', nullable: true },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            channelId: { type: 'integer' },
            authorId: { type: 'integer', nullable: true },
            content: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Resource: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            url: { type: 'string', format: 'uri', nullable: true },
            category: { type: 'string', nullable: true },
            fileName: { type: 'string', nullable: true },
            mimeType: { type: 'string', nullable: true },
            size: { type: 'integer', nullable: true },
            storagePath: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        NewsPost: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            authorId: { type: 'integer' },
            isPublished: { type: 'boolean' },
            isPinned: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', enum: ['admin', 'captain', 'coach', 'treasurer', 'player', 'guest'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE', 'PERMISSION_CHANGE', 'FILE_UPLOAD', 'FILE_DELETE'] },
            entityType: { type: 'string' },
            entityId: { type: 'integer', nullable: true },
            userId: { type: 'integer', nullable: true },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            details: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Autenticación, Login, Registro y Recuperación de Claves' },
      { name: 'Users', description: 'Gestión y Aprobación de Usuarios y Roles' },
      { name: 'Players', description: 'Gestión del Roster de Jugadores y Fichas Técnicas' },
      { name: 'Events', description: 'Torneos, Partidos y Entrenamientos' },
      { name: 'Annotations', description: 'Anotaciones en Vivo, Marcador Táctil, Goles, Asistencias y Defensas' },
      { name: 'Stats', description: 'Estadísticas Globales y de Partidos en Tiempo Real' },
      { name: 'EventParticipants', description: 'Convocatorias de Jugadores por Líneas (O-Line / D-Line / Flex)' },
      { name: 'Attendance', description: 'Control y Registro de Asistencia a Eventos' },
      { name: 'Transactions', description: 'Transacciones Financieras y Balances del Club' },
      { name: 'Accounts', description: 'Cuentas Financieras (Banco, Caja)' },
      { name: 'Categories', description: 'Categorías de Ingresos y Egresos' },
      { name: 'Injuries', description: 'Historial Médico y Readaptación de Lesiones' },
      { name: 'Plays', description: 'Libro Táctico y Pizarra de Jugadas Ofensivas/Defensivas' },
      { name: 'Rivals', description: 'Scouting de Equipos y Jugadores Rivales' },
      { name: 'Channels', description: 'Canales de Comunicación del Equipo y Torneos' },
      { name: 'Messages', description: 'Mensajería en Tiempo Real' },
      { name: 'News', description: 'Noticias Oficiales y Comunicados del Club' },
      { name: 'Resources', description: 'Recursos Informativos, Documentos y Reglamento WFDF' },
      { name: 'Audit', description: 'Trazabilidad y Logs de Auditoría del Sistema' },
      { name: 'Health', description: 'Monitoreo de Estado del Servidor y Base de Datos' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
