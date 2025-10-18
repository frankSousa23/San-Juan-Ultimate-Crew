import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'dotenv/config';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger, errorLogger } from './middleware/logging.js';
import { generalLimiter, authLimiter, uploadLimiter, securityHeaders, sanitizeRequest, corsOptions } from './middleware/security.js';
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
import path from 'path';
export const app = express();
// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Logging middleware
app.use(requestLogger);
app.use(morgan('combined'));
// Rate limiting
app.use(generalLimiter);
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
// Apply specific rate limiting to auth routes
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
// Apply upload rate limiting to resource uploads
app.use('/api/resources/upload', uploadLimiter);
// Serve uploaded files statically
const uploadsDir = path.resolve(process.cwd(), 'apps', 'api', 'uploads');
app.use('/uploads', express.static(uploadsDir));
app.get('/', (_req, res) => res.json({ name: 'San Juan Ultimate Crew API', ok: true }));
// Error handling middleware (must be last)
app.use(errorLogger);
app.use(errorHandler);
