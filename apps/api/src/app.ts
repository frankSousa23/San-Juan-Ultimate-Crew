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
import { fileURLToPath } from 'url';

const currentFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url || 'file://' + process.cwd() + '/index.js');
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);

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
app.use('/api/news', newsRouter);
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
const possibleUploadDirs = [
  path.resolve(process.cwd(), 'apps', 'api', 'uploads'),
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(currentDir, '..', 'uploads'),
  path.resolve(currentDir, 'uploads'),
  '/app/apps/api/uploads',
  '/app/uploads',
];
let activeUploadsDir = possibleUploadDirs[0];
for (const uDir of possibleUploadDirs) {
  if (fs.existsSync(uDir)) {
    activeUploadsDir = uDir;
    break;
  }
}
app.use('/uploads', express.static(activeUploadsDir));

app.get('/api', (_req: Request, res: Response) => res.json({ name: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) API', ok: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) API Documentation',
}));

// Resolve frontend SPA distribution directory dynamically
export function findWebDistPath(): string | null {
  const candidatePaths = [
    path.resolve(process.cwd(), 'apps', 'web', 'dist'),
    path.resolve(process.cwd(), '..', 'web', 'dist'),
    path.resolve(process.cwd(), 'web', 'dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), 'dist', 'public'),
    path.resolve(currentDir, 'public'),
    path.resolve(currentDir, '..', 'public'),
    path.resolve(currentDir, '..', '..', 'apps', 'web', 'dist'),
    path.resolve(currentDir, '..', '..', 'web', 'dist'),
    path.resolve(currentDir, '..', 'apps', 'web', 'dist'),
    path.resolve(currentDir, 'dist'),
    '/app/apps/web/dist',
    '/app/apps/api/dist/public',
    '/app/dist',
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

// In production or standalone mode, serve frontend static assets dynamically
app.use((req: Request, res: Response, next: NextFunction) => {
  const dist = findWebDistPath();
  if (dist && fs.existsSync(dist)) {
    return express.static(dist, { maxAge: '1d', index: false })(req, res, next);
  }
  return next();
});

// Universal SPA router fallback - serves frontend index.html for all non-API web routes
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

  const resolvedDist = findWebDistPath();
  if (resolvedDist) {
    const indexPath = path.join(resolvedDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }

  // Fallback to source web/index.html if available
  const sourceWebCandidates = [
    path.resolve(process.cwd(), 'apps', 'web', 'index.html'),
    path.resolve(process.cwd(), '..', 'web', 'index.html'),
    path.resolve(currentDir, '..', '..', 'apps', 'web', 'index.html'),
  ];
  for (const srcIndex of sourceWebCandidates) {
    if (fs.existsSync(srcIndex)) {
      return res.sendFile(srcIndex);
    }
  }

  // Graceful fallback web portal if dist folder is still building
  res.status(200).send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIGEDIVO - Portal del Sistema</title>
  <style>
    :root { --primary: #2563eb; --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: var(--card); border: 1px solid #334155; border-radius: 16px; max-width: 640px; width: 100%; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { display: inline-block; background: rgba(37,99,235,0.2); color: #60a5fa; padding: 4px 12px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 16px; border: 1px solid rgba(96,165,250,0.3); }
    h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 8px; }
    p { color: var(--muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .btn { display: flex; align-items: center; justify-content: center; text-decoration: none; padding: 12px 16px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #334155; color: white; }
    .btn-secondary:hover { background: #475569; }
    .status { font-size: 0.8rem; color: #4ade80; display: flex; align-items: center; gap: 6px; }
    .status::before { content: ""; width: 8px; height: 8px; background: #4ade80; border-radius: 50%; display: inline-block; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">SIGEDIVO v1.2.0</span>
    <h1>San Juan Ultimate Crew</h1>
    <p>Sistema de Gestión Deportiva para Ultimate Frisbee. El backend y los servicios están activos y sincronizados con PostgreSQL.</p>
    <div class="grid">
      <a href="/api-docs" class="btn btn-primary">📖 Documentación API (Swagger)</a>
      <a href="/health" class="btn btn-secondary">🏥 Estado de Salud (/health)</a>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 16px;">
      <span class="status">Servidor Operativo</span>
      <span style="font-size: 0.8rem; color: var(--muted);">Node.js API & Web</span>
    </div>
  </div>
</body>
</html>`);
});

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(errorHandler);
