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
  : fileURLToPath(import.meta.url || 'file://' + process.cwd() + '/index.js');
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
// 5. MANEJO GLOBAL DE ERRORES DE LA API
// ============================================================================
app.use(errorLogger);
app.use(errorHandler);

// ============================================================================
// 6. SERVIDO ESTÁTICO DE LA SPA & ENRUTAMIENTO WILDCARD
// ============================================================================
function getWebDistCandidates() {
  return [
    path.resolve(process.cwd(), 'apps', 'web', 'dist'),
    path.resolve(process.cwd(), '..', 'web', 'dist'),
    path.resolve(process.cwd(), 'dist', 'web'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(process.cwd(), 'apps', 'api', 'dist', 'web'),
    path.resolve(currentDir, '..', '..', 'web', 'dist'),
    path.resolve(currentDir, '..', 'web', 'dist'),
    path.resolve(currentDir, '..', 'dist', 'web'),
    path.resolve(currentDir, '..', 'dist'),
    path.resolve(currentDir, 'web'),
    path.resolve(currentDir, 'dist'),
    path.resolve(currentDir, 'dist', 'web'),
    '/app/apps/web/dist',
    '/app/dist',
    '/app/apps/api/dist/web',
    '/apps/web/dist',
  ];
}

// Registrar directorios estáticos disponibles
for (const d of getWebDistCandidates()) {
  if (d && fs.existsSync(d)) {
    app.use(express.static(d));
  }
}

// Wildcard SPA Fallback: Cualquier ruta que no sea API entrega index.html
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const urlPath = req.path || req.url;
  if (
    urlPath.startsWith('/api') ||
    urlPath.startsWith('/health') ||
    urlPath.startsWith('/uploads') ||
    urlPath.startsWith('/api-docs')
  ) {
    return next();
  }

  // 1. Intentar servir activo estático solicitado si existe en el build
  const cleanPath = urlPath.replace(/^\/+/, '');
  for (const distDir of getWebDistCandidates()) {
    if (distDir && fs.existsSync(distDir)) {
      const assetPath = path.join(distDir, cleanPath);
      if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
        return res.sendFile(assetPath);
      }
    }
  }

  // 2. De lo contrario, entregar el index.html de la SPA
  for (const distDir of getWebDistCandidates()) {
    if (distDir && fs.existsSync(distDir)) {
      const candidateIndex = path.join(distDir, 'index.html');
      if (fs.existsSync(candidateIndex)) {
        return res.sendFile(candidateIndex);
      }
    }
  }

  // Fallback a rutas directas comunes
  const directIndexCandidates = [
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(process.cwd(), 'apps', 'web', 'dist', 'index.html'),
    path.resolve(process.cwd(), 'apps', 'web', 'index.html'),
    path.resolve(currentDir, 'index.html'),
  ];
  for (const directIndex of directIndexCandidates) {
    if (fs.existsSync(directIndex)) {
      return res.sendFile(directIndex);
    }
  }

  // Respuesta de contingencia si el frontend aún no ha sido compilado
  return res.json({
    name: 'SIGEDIVO (Sistema de Gestión para el Disco Volador) API',
    status: 'online',
    version: '1.2.0',
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: '/api-docs',
    },
  });
});
