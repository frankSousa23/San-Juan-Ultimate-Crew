import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

export default router;

// Extra: DB health
router.get('/db', async (_req: Request, res: Response) => {
  try {
    const [players, events] = await Promise.all([
      prisma.player.count(),
      prisma.event.count(),
    ]);
    res.json({ ok: true, players, events });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'db error' });
  }
});
