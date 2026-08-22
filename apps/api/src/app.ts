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
  // If running standalone API mode without web dist, provide a clean JSON/HTML landing on root
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
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 560px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; }
            h1 { font-size: 24px; margin-bottom: 8px; color: #38bdf8; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
            .btn-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
            a.btn { background: #2563eb; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 14px; transition: 0.2s; }
            a.btn:hover { background: #1d4ed8; }
            a.btn-secondary { background: #334155; color: #e2e8f0; }
            a.btn-secondary:hover { background: #475569; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🥏 SIGEDIVO API Online</h1>
            <p>El servidor Backend de SIGEDIVO (Sistema de Gestión para el Disco Volador) está operando correctamente.</p>
            <div class="btn-group">
              <a href="/api-docs" class="btn">📖 Documentación Swagger</a>
              <a href="/health" class="btn btn-secondary">🩺 Estado del Sistema (/health)</a>
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
      health: '/health',
      api_base: '/api'
    });
  });
}

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(errorHandler);
