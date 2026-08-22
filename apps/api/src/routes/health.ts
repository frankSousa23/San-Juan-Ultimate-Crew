import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success } from '../lib/response.js';
import type { HealthResponse, DatabaseHealthResponse, SystemHealthResponse } from '../types/index.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 time:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 */
router.get('/', (_req: Request, res: Response) => {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const environment = process.env.NODE_ENV || 'production';
  const version = '1.2.0';

  return res.status(200).json({
    status: 'OK',
    ok: true,
    message: 'SIGEDIVO API is running',
    timestamp: new Date().toISOString(),
    time: new Date().toISOString(),
    version,
    environment,
    port,
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Database health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 database:
 *                   type: string
 *                 responseTime:
 *                   type: string
 *                 counts:
 *                   type: object
 *       500:
 *         description: Database connection failed
 */
router.get('/db', asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const [players, events, users, transactions] = await Promise.all([
      prisma.player.count(),
      prisma.event.count(),
      prisma.user.count(),
      prisma.transaction.count(),
    ]);
    
    const responseTime = Date.now() - startTime;
    
    const response: DatabaseHealthResponse = {
      ok: true,
      database: 'connected',
      responseTime: `${responseTime}ms`,
      counts: {
        players,
        events,
        users,
        transactions,
      },
    };
    
    return success(res, response);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

/**
 * @swagger
 * /health/system:
 *   get:
 *     summary: Detailed system health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 system:
 *                   type: object
 */
router.get('/system', (_req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  
  const response: SystemHealthResponse = {
    ok: true,
    system: {
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  };
  
  return success(res, response);
});

export default router;
