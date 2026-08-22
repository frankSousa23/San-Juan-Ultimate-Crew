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
    path.resolve(process.cwd(), 'dist'),
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), 'dist', 'public'),
    path.resolve(currentDir, 'public'),
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

// In production or standalone mode, serve frontend static assets
const webDist = findWebDistPath();
if (webDist) {
  app.use(express.static(webDist, { maxAge: '1d', index: false }));
}

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

  return next();
});

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(errorHandler);
