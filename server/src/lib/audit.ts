import { prisma } from '../db/prisma'
import { logger } from './logger'

export type AuditAction =
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'
  | 'ORG_CREATED' | 'ORG_UPDATED'
  | 'GOOGLE_ACCOUNT_CONNECTED' | 'GOOGLE_ACCOUNT_DISCONNECTED'
  | 'PROFILE_CREATED' | 'PROFILE_UPDATED' | 'PROFILE_SYNCED'
  | 'REVIEW_REPLIED' | 'REVIEW_FLAGGED'
  | 'POST_CREATED' | 'POST_PUBLISHED'
  | 'SYNC_JOB_STARTED' | 'SYNC_JOB_COMPLETED' | 'SYNC_JOB_FAILED'

interface AuditParams {
  userId?: string; organizationId?: string; profileId?: string
  action: AuditAction; entityType: string; entityId: string
  metadata?: Record<string, unknown>; ipAddress?: string; userAgent?: string
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.auditLog.create as any)({ data: params })
  } catch (err) {
    logger.error('Failed to write audit log', { err, params })
  }
}
