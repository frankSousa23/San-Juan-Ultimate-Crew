import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'San Juan Ultimate Crew API',
      version: '1.0.0',
      description: 'API para la gestión del equipo de Ultimate Frisbee San Juan',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
      ...(env.NODE_ENV === 'production' && process.env.API_URL
        ? [
            {
              url: process.env.API_URL,
              description: 'Production server',
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
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Player: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            number: { type: 'integer' },
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
            type: { type: 'string', enum: ['TRAINING', 'TOURNAMENT', 'SOCIAL', 'WORKSHOP'] },
            status: { type: 'string', enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
            location: { type: 'string', nullable: true },
            startsAt: { type: 'string', format: 'date-time' },
            endsAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            accountId: { type: 'integer' },
            categoryId: { type: 'integer', nullable: true },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE', 'TRANSFER'] },
            amountCents: { type: 'integer' },
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
              description: 'User account status'
            },
            roles: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of role names',
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
        RoleRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            role: { type: 'string', enum: ['player'] },
            playerId: { type: 'integer', nullable: true },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'DENIED'] },
            note: { type: 'string', nullable: true },
            decidedById: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            decidedAt: { type: 'string', format: 'date-time', nullable: true },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', enum: ['admin', 'player', 'guest'] },
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
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Players', description: 'Player management' },
      { name: 'Events', description: 'Event management' },
      { name: 'Transactions', description: 'Financial transactions' },
      { name: 'Resources', description: 'Resource management' },
      { name: 'Users', description: 'User management' },
      { name: 'Audit', description: 'Audit logs' },
      { name: 'Accounts', description: 'Financial accounts management' },
      { name: 'Categories', description: 'Transaction categories management' },
      { name: 'Injuries', description: 'Player injuries management' },
      { name: 'Plays', description: 'Plays and drills management' },
      { name: 'Attendance', description: 'Event attendance management' },
      { name: 'Channels', description: 'Communication channels' },
      { name: 'EventParticipants', description: 'Event participants management' },
      { name: 'Rivals', description: 'Rival teams management' },
      { name: 'Messages', description: 'Channel messages' },
      { name: 'Stats', description: 'Dashboard statistics' },
      { name: 'Annotations', description: 'Event annotations management' },
      { name: 'News', description: 'News posts and announcements' },
      { name: 'Health', description: 'Health check endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

