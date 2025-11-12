import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success } from '../lib/response.js';
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
router.get('/', (_req, res) => {
    const response = {
        ok: true,
        time: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    };
    return success(res, response);
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
router.get('/db', asyncHandler(async (_req, res) => {
    const startTime = Date.now();
    try {
        const [players, events, users, transactions] = await Promise.all([
            prisma.player.count(),
            prisma.event.count(),
            prisma.user.count(),
            prisma.transaction.count(),
        ]);
        const responseTime = Date.now() - startTime;
        const response = {
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
    }
    catch (error) {
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
router.get('/system', (_req, res) => {
    const memUsage = process.memoryUsage();
    const response = {
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
