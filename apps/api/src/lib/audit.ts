import { prisma } from './prisma.js'
import { Request } from 'express'
import { AuditAction } from '@prisma/client'

interface AuditContext {
  userId?: number
  ipAddress?: string
  userAgent?: string
  details?: Record<string, unknown>
}

export async function logAudit(
  action: AuditAction,
  entityType: string,
  context: AuditContext,
  entityId?: number
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId: entityId ?? null,
        userId: context.userId ?? null,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        details: context.details ? JSON.stringify(context.details) : null,
      },
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    // Log to logger instead
    const { logger } = await import('./logger.js')
    logger.error('Failed to log audit', error instanceof Error ? error : new Error(String(error)), {
      action,
      entityType,
      entityId,
    })
  }
}

export function getAuditContext(req: Request): AuditContext {
  const userId = (req as any).user?.sub ? Number((req as any).user.sub) : undefined
  const ipAddress = req.ip || req.socket.remoteAddress || undefined
  const userAgent = req.get('user-agent') || undefined

  return {
    userId,
    ipAddress,
    userAgent,
  }
}

export function createAuditHelper(req: Request) {
  const context = getAuditContext(req)

  return {
    log: async (
      action: AuditAction,
      entityType: string,
      entityId?: number,
      details?: Record<string, unknown>
    ) => {
      await logAudit(action, entityType, { ...context, details }, entityId)
    },
  }
}

