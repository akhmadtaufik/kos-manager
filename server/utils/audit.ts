import { db } from '../db'
import { activityLogs } from '../db/schema'

interface LogActivityParams {
  userId?: string
  actorName?: string
  actorRole?: string
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
}

/**
 * Reusable audit trail logger
 * Silently records CRUD events into the activity_logs table.
 * 
 * Usage:
 *   await logActivity({
 *     userId: session.user.id,
 *     action: 'CREATE',
 *     entityType: 'tenant',
 *     entityId: newTenant.id,
 *     details: { name: 'John', roomId: '...' }
 *   })
 * 
 * This function NEVER throws — errors are silently logged to console
 * to prevent audit failures from blocking business operations.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      userId: params.userId || null,
      actorName: params.actorName || null,
      actorRole: params.actorRole || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      details: params.details || null,
    })
  } catch (error) {
    // Silent fail — audit logging should never break business operations
    console.error('[AuditLog] Failed to log activity:', error)
  }
}
