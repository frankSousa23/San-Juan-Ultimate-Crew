import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger, errorLogger } from './middleware/logging.js';
import { generalLimiter, authLimiter, passwordResetLimiter, uploadLimiter, writeLimiter, readLimiter, securityHeaders, sanitizeRequest, corsOptions } from './middleware/security.js';
import { swaggerSpec } from './lib/swagger.js';

import healthRouter from './routes/health.js';
import playersRouter from './routes/players.js';
import eventsRouter from './routes/events.js';
import channelsRouter from './routes/channels.js';
import messagesRouter from './routes/messages.js';
import accountsRouter from './routes/accounts.js';
import categoriesRouter from './routes/categories.js';
import transactionsRouter from './routes/transactions.js';
import statsRouter from './routes/stats.js';
import attendanceRouter from './routes/attendance.js';
import injuriesRouter from './routes/injuries.js';
import rivalsRouter from './routes/rivals.js';
import playsRouter from './routes/plays.js';
import eventParticipantsRouter from './routes/eventParticipants.js';
import resourcesRouter from './routes/resources.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import auditRouter from './routes/audit.js';
import annotationsRouter from './routes/annotations.js';
import newsRouter from './routes/news.js';
import { teamsRouter } from './routes/teams.js';
import { feedbackRouter } from './routes/feedback.js';
import path from 'path';
import fs from 'fs';

export const app = express();
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));

// Compression middleware (should be before body parsing)
app.use(compression({
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, 6 is a good balance)
  threshold: 1024, // Only compress responses larger than 1KB
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);
app.use(morgan('combined'));

// Rate limiting - Apply general limiter first, then specific limiters on routes
app.use(generalLimiter);
// Apply read/write specific limiters
app.use(readLimiter);
app.use(writeLimiter);

// Request sanitization
app.use(sanitizeRequest);

app.use('/health', healthRouter);
app.use('/api/health', healthRouter);
app.use('/api/players', playersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/injuries', injuriesRouter);
app.use('/api/rivals', rivalsRouter);
app.use('/api/plays', playsRouter);
app.use('/api/event-participants', eventParticipantsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/annotations', annotationsRouter);
app.use('/api/news', newsRouter)
app.use('/api/teams', teamsRouter);
app.use('/api/feedback', feedbackRouter);
// Apply specific rate limiting to auth routes
app.use('/api/auth', authLimiter);
// Apply stricter rate limiting to password reset endpoints
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit', auditRouter);

// Apply upload rate limiting to resource uploads
app.use('/api/resources/upload', uploadLimiter);

// Serve uploaded files statically
const uploadsDir = path.resolve(process.cwd(), 'apps', 'api', 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/api', (_req: Request, res: Response) => res.json({ name: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) API', ok: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) API Documentation',
}));

// Web Static Assets & SPA Handler (if web build exists)
const possibleWebDists = [
  path.resolve(process.cwd(), 'apps', 'web', 'dist'),
  path.resolve(process.cwd(), '..', 'web', 'dist'),
  path.resolve(process.cwd(), 'dist'),
];

let webDistPath: string | null = null;
for (const dir of possibleWebDists) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    webDistPath = dir;
    break;
  }
}

if (webDistPath) {
  app.use(express.static(webDistPath));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const url = req.originalUrl || req.url;
    if (
      url.startsWith('/api') ||
      url.startsWith('/health') ||
      url.startsWith('/uploads') ||
      url.startsWith('/api-docs')
    ) {
      return next();
    }
    if (webDistPath && fs.existsSync(path.join(webDistPath, 'index.html'))) {
      return res.sendFile(path.join(webDistPath, 'index.html'));
    }
    return next();
  });
} else {
  // If running standalone API mode without web dist, provide a styled HTML landing on root
  app.get('/', (_req: Request, res: Response) => {
    if (_req.accepts('html')) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SIGEDIVO - API Backend</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              padding: 40px;
              max-width: 600px;
              width: 100%;
              text-align: center;
            }
            h1 {
              color: #1a202c;
              font-size: 2.5em;
              margin-bottom: 10px;
              font-weight: 800;
            }
            .subtitle {
              color: #4a5568;
              font-size: 1.2em;
              margin-bottom: 8px;
              font-weight: 600;
            }
            .description {
              color: #718096;
              font-size: 1.05em;
              margin-bottom: 25px;
            }
            .status {
              background: #e6fffa;
              border: 2px solid #38b2ac;
              color: #234e52;
              padding: 12px 20px;
              border-radius: 12px;
              font-weight: 700;
              margin: 20px 0;
              display: inline-block;
            }
            .links {
              margin: 35px 0;
              display: flex;
              gap: 15px;
              justify-content: center;
              flex-wrap: wrap;
            }
            .btn {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 14px 28px;
              border-radius: 10px;
              text-decoration: none;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            .btn:hover {
              transform: translateY(-3px);
              box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
              background: #5568d3;
            }
            .btn-secondary {
              background: #6b7280;
            }
            .btn-secondary:hover {
              background: #4b5563;
            }
            .footer {
              margin-top: 40px;
              padding-top: 25px;
              border-top: 2px solid #e5e7eb;
              color: #6b7280;
              font-size: 0.95em;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
              font-weight: 600;
              transition: color 0.2s;
            }
            .footer a:hover {
              color: #5568d3;
              text-decoration: underline;
            }
            .version {
              display: inline-block;
              background: #f3f4f6;
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 0.85em;
              color: #6b7280;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🥏 SIGEDIVO</h1>
            <p class="subtitle">Sistema de Gestión para el Disco Volador</p>
            <p class="description"><strong>San Juan Ultimate Crew</strong> - Venezuela 🇻🇪</p>
            <div class="status">✅ API Activa y Funcionando</div>
            
            <div class="links">
              <a href="/api-docs" class="btn">📚 Documentación API</a>
              <a href="/api/health" class="btn btn-secondary">🏥 Health Check</a>
            </div>
            
            <div class="footer">
              <p><strong>Autor:</strong> Frank Sousa (@frankSousa23)</p>
              <p style="margin-top: 8px;">
                San Juan de los Morros, Estado Guárico
              </p>
              <p style="margin-top: 15px;">
                <a href="https://github.com/frankSousa23/San-Juan-Ultimate-Crew" target="_blank">
                  ⭐ Ver en GitHub
                </a>
              </p>
              <div class="version">v1.2.0 | Licencia MIT | Open Source</div>
            </div>
          </div>
        </body>
        </html>
      `);
    }
    return res.json({
      name: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) API',
      status: 'online',
      documentation: '/api-docs',
      health: '/api/health',
      api_base: '/api'
    });
  });
}

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(errorHandler);
