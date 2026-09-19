/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * RUTAS DE MANTENIMIENTO Y PUESTA EN MARCHA (apps/api/src/routes/maintenance.ts)
 * ============================================================================
 * 
 * Endpoints administrativos para:
 * 1. Consultar el estado de datos del sistema (si hay datos de prueba o si está limpio).
 * 2. Limpiar todos los datos de prueba en 1 clic para empezar de cero con datos reales.
 * 3. Recargar datos de prueba de muestra para integración y exploración inicial.
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireRole } from './auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { success, badRequest } from '../lib/response.js';
import { cleanSampleData, seedSampleData } from '../lib/sampleDataService.js';

export const maintenanceRouter = Router();

/**
 * GET /api/admin/maintenance/status
 * Estado de datos en el sistema (conteo de registros para saber si está limpio)
 */
maintenanceRouter.get('/status', requireRole(['admin']), asyncHandler(async (_req: Request, res: Response) => {
  const [playerCount, eventCount, transactionCount] = await Promise.all([
    prisma.player.count(),
    prisma.event.count(),
    prisma.transaction.count(),
  ]);

  return success(res, {
    playerCount,
    eventCount,
    transactionCount,
    isClean: playerCount === 0 && eventCount === 0 && transactionCount === 0,
  });
}));

/**
 * POST /api/admin/maintenance/clean-sample-data
 * Limpia todos los datos de prueba para empezar de cero con la información del club
 */
maintenanceRouter.post('/clean-sample-data', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  const result = await cleanSampleData(prisma);

  // Registrar auditoría si el modelo auditLog existe
  try {
    const user = (req as any).user;
    if (prisma.auditLog) {
      await prisma.auditLog.create({
        data: {
          action: 'MAINTENANCE_CLEAN_SAMPLE_DATA',
          entityType: 'System',
          entityId: null,
          userId: user?.id ? Number(user.id) : null,
          details: { deletedCounts: result.deletedCounts },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
        }
      });
    }
  } catch (e) { /* ignore audit error */ }

  return success(res, {
    message: 'Datos de prueba limpiados exitosamente. El sistema está limpio y listo para registrar la información oficial de tu club.',
    deletedCounts: result.deletedCounts,
  });
}));

/**
 * POST /api/admin/maintenance/seed-sample-data
 * Recarga datos de prueba de muestra para explorar las funcionalidades del sistema
 */
maintenanceRouter.post('/seed-sample-data', requireRole(['admin']), asyncHandler(async (req: Request, res: Response) => {
  await seedSampleData(prisma);

  // Registrar auditoría si el modelo auditLog existe
  try {
    const user = (req as any).user;
    if (prisma.auditLog) {
      await prisma.auditLog.create({
        data: {
          action: 'MAINTENANCE_SEED_SAMPLE_DATA',
          entityType: 'System',
          entityId: null,
          userId: user?.id ? Number(user.id) : null,
          details: { action: 'Re-seeded demo sample data' },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
        }
      });
    }
  } catch (e) { /* ignore audit error */ }

  return success(res, {
    message: 'Datos de prueba de muestra recargados exitosamente.',
  });
}));

export default maintenanceRouter;
