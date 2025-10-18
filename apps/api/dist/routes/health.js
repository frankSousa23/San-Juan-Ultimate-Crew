import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';
const router = Router();
// Basic health check
router.get('/', (_req, res) => {
    res.json({
        ok: true,
        time: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Database health check
router.get('/db', asyncHandler(async (_req, res) => {
    const startTime = Date.now();
    const [players, events, users, transactions] = await Promise.all([
        prisma.player.count(),
        prisma.event.count(),
        prisma.user.count(),
        prisma.transaction.count(),
    ]);
    const responseTime = Date.now() - startTime;
    res.json({
        ok: true,
        database: 'connected',
        responseTime: `${responseTime}ms`,
        counts: {
            players,
            events,
            users,
            transactions
        }
    });
}));
// Detailed system health
router.get('/system', (_req, res) => {
    const memUsage = process.memoryUsage();
    res.json({
        ok: true,
        system: {
            uptime: process.uptime(),
            memory: {
                rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
            },
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        }
    });
});
export default router;
