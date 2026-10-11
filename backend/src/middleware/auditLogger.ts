import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuditAction } from '@prisma/client';
import { logger } from '../config/logger';

export async function createAuditLog(params: {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
  req?: Request;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue as any,
        newValue: params.newValue as any,
        ipAddress: params.req?.ip,
        userAgent: params.req?.headers['user-agent'],
      },
    });
  } catch (err) {
    logger.error('Failed to create audit log:', err);
  }
}
