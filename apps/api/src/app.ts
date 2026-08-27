/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * APLICACIÓN PRINCIPAL EXPRESS & ENRUTAMIENTO API (apps/api/src/app.ts)
 * ============================================================================
 * 
 * Este módulo configura y exporta la instancia principal de la aplicación Express (`app`).
 * 
 * RESPONSABILIDADES Y MIDDLEWARES:
 * 1. Encabezados de Seguridad (Helmet / Custom CSP):
 *    - Protección contra ataques XSS, Clickjacking, MIME-sniffing e inyecciones.
 * 2. Políticas CORS Dinámicas:
 *    - Admite peticiones desde el frontend web y entornos de previsualización.
 * 3. Compresión GZIP/Brotli:
 *    - Optimiza transferencias reduciendo drásticamente el peso de payloads JSON y estáticos.
 * 4. Control de Tasa (Rate Limiting):
 *    - Limitadores globales y específicos para login, registro y endpoints de escritura.
 * 5. Sanitización y Logs Auditables:
 *    - Limpieza recursiva de entradas y registro estructurado de actividad en consola.
 * 6. Enrutamiento Modular REST:
 *    - Equipos, Usuarios, Roster, Partidos, Anotaciones en Vivo, Finanzas, Salud, Táctica.
 * 7. Documentación Interactiva OpenAPI / Swagger (/api-docs):
 *    - Especificación completa de contratos y schemas en Swagger UI.
 * 8. Fallback SPA (Single Page Application):
 *    - Asegura la recarga directa en cualquier ruta del frontend React.
 * ============================================================================
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger, errorLogger } from './middleware/logging.js';
import { 
  generalLimiter, 
  authLimiter, 
  passwordResetLimiter, 
  uploadLimiter, 
  writeLimiter, 
  readLimiter, 
  securityHeaders, 
  sanitizeRequest, 
  corsOptions 
} from './middleware/security.js';
import { swaggerSpec } from './lib/swagger.js';

// --- ENRUTADORES MODULARES DE LA API ---
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

const currentFilename = typeof __filename !== 'undefined' 
  ? __filename 
  : (process.argv && process.argv[1]) || path.resolve(process.cwd(), 'index.js');
const currentDir = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(currentFilename);

export const app = express();

// Confianza en proxies inversos (Cloud Run / Nginx / Traefik / Seenode)
app.set('trust proxy', 1);

// ============================================================================
// 1. CAPA DE SEGURIDAD Y OPTIMIZACIÓN HTTP
// ============================================================================
app.use(securityHeaders);
app.use(cors(corsOptions));

// Compresión de respuestas (nivel 6 para óptimo balance CPU/tamaño)
app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024, // Solo comprimir respuestas mayores a 1KB
}));

// Parseo de cuerpos de petición JSON y URL-encoded (límite 10MB para adjuntos)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// 2. LOGGING Y CONTROL DE TASA (RATE LIMITING)
// ============================================================================
app.use(requestLogger);
app.use(morgan('combined'));

// Rate limiting general y diferenciado por operaciones
app.use(generalLimiter);
app.use(readLimiter);
app.use(writeLimiter);

// Sanitización de entradas contra inyecciones NoSQL / scripts maliciosos
app.use(sanitizeRequest);

// ============================================================================
// 3. REGISTRO DE RUTAS DE LA API REST
// ============================================================================

// Verificación de estado del servicio y dependencias
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// Gestión de Equipos y Divisiones Multi-Club
app.use('/api/teams', teamsRouter);

// Plantilla de Atletas y Roster Oficial
app.use('/api/players', playersRouter);

// Calendario, Torneos, Partidos y Convocatorias
app.use('/api/events', eventsRouter);
app.use('/api/event-participants', eventParticipantsRouter);
app.use('/api/attendance', attendanceRouter);

// Mesa Técnica y Anotaciones en Vivo (Puntos, Goles, Asistencias, D's, SOTG)
app.use('/api/annotations', annotationsRouter);

// Estadísticas de Rendimiento y Tablas de Líderes
app.use('/api/stats', statsRouter);

// Comunicaciones, Canales y Mensajería Interna
app.use('/api/channels', channelsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/news', newsRouter);

// Finanzas, Libro Diario y Tesorería
app.use('/api/accounts', accountsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);

// Salud Médica y Fichas de Lesiones
app.use('/api/injuries', injuriesRouter);

// Inteligencia Táctica y Scouting de Adversarios
app.use('/api/rivals', rivalsRouter);

// Pizarrón Táctico y Libro de Jugadas (Playbook)
app.use('/api/plays', playsRouter);

// Biblioteca de Recursos y Documentos Oficiales WFDF
app.use('/api/resources', resourcesRouter);

// Buzón de Comentarios y Feedback
app.use('/api/feedback', feedbackRouter);

// Autenticación, Registro y Gestión de Sesiones (con Rate Limit estricto)
app.use('/api/auth', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth', authRouter);

// Gestión de Usuarios y Permisos RBAC (Panel Super Admin)
app.use('/api/users', usersRouter);

// Pista de Auditoría Inmutable (Audit Trail)
app.use('/api/audit', auditRouter);

// Límite de carga para archivos adjuntos
app.use('/api/resources/upload', uploadLimiter);

// ============================================================================
// 4. ARCHIVOS ESTÁTICOS Y DOCUMENTACIÓN SWAGGER
// ============================================================================

// Servir archivos subidos (avatares, documentos, tácticas)
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

// Endpoint raíz de confirmación API
app.get('/api', (_req: Request, res: Response) => 
  res.json({ name: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) API', ok: true, version: '1.2.0' })
);

// Interfaz Interactiva de Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) API Documentation',
}));

// ============================================================================
// 5. SERVICIO DE APLICACIÓN WEB (SPA) Y ASSETS ESTÁTICOS DE PRODUCCIÓN
// ============================================================================
const possibleStaticDirs = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), 'apps', 'web', 'dist'),
  path.resolve(process.cwd(), 'apps', 'api', 'dist', 'web'),
  path.resolve(currentDir, '..', '..', '..', 'dist'),
  path.resolve(currentDir, '..', '..', 'web', 'dist'),
  path.resolve(currentDir, '..', 'web'),
  path.resolve(currentDir, 'web'),
  path.resolve(currentDir, 'dist'),
  path.resolve(currentDir),
  '/app/dist',
  '/app/apps/web/dist',
  '/app/apps/api/dist/web',
];

const registeredStaticDirs = new Set<string>();
for (const sDir of possibleStaticDirs) {
  if (sDir && fs.existsSync(sDir) && !registeredStaticDirs.has(sDir)) {
    registeredStaticDirs.add(sDir);
    app.use(express.static(sDir, { maxAge: '1h', index: false }));
  }
}

// Fallback para rutas API inexistentes (evita que caigan en el SPA HTML fallback)
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
  });
});

// Enrutador SPA Fallback: Sirve index.html para cualquier ruta GET del frontend
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const url = req.originalUrl || req.url;
  if (
    url.startsWith('/api') ||
    url.startsWith('/health') ||
    url.startsWith('/uploads') ||
    url.startsWith('/api-docs')
  ) {
    return next();
  }

  const candidateIndexPaths = [
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(process.cwd(), 'apps', 'web', 'dist', 'index.html'),
    path.resolve(process.cwd(), 'apps', 'api', 'dist', 'web', 'index.html'),
    path.resolve(currentDir, '..', '..', '..', 'dist', 'index.html'),
    path.resolve(currentDir, '..', '..', 'web', 'dist', 'index.html'),
    path.resolve(currentDir, '..', 'web', 'index.html'),
    path.resolve(currentDir, 'web', 'index.html'),
    path.resolve(currentDir, 'dist', 'index.html'),
    path.resolve(currentDir, 'index.html'),
    '/app/dist/index.html',
    '/app/apps/web/dist/index.html',
    '/app/apps/api/dist/web/index.html',
  ];

  for (const indexPath of candidateIndexPaths) {
    if (indexPath && fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }

  // Si no se encuentra un bundle compilado, retornar mensaje HTML informativo en lugar de un error 404 plano
  return res.status(200).send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIGEDIVO - Iniciando Servidor</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; }
    h1 { margin-top: 0; color: #38bdf8; font-size: 24px; }
    p { color: #94a3b8; line-height: 1.6; }
    .btn { display: inline-block; margin-top: 16px; background: #0284c7; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
  <script>setTimeout(function(){ location.reload(); }, 3000);</script>
</head>
<body>
  <div class="card">
    <h1>SIGEDIVO (Sistema de Gestión para el Disco Volador)</h1>
    <p>El servidor API está activo. Los artefactos del frontend se están cargando...</p>
    <p><small>Recargando automáticamente en 3 segundos...</small></p>
    <a href="/api/health" class="btn">Ver Estado del Backend</a>
  </div>
</body>
</html>`);
});

// ============================================================================
// 6. MANEJO GLOBAL DE ERRORES DE LA API
// ============================================================================
app.use(errorLogger);
app.use(errorHandler);

