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
  before?: Record<string, unknown>
  after?: Record<string, unknown>
}

/**
 * Reusable audit trail logger
 * Silently records CRUD events into the activity_logs table.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    let finalDetails = params.details || {}

    // Auto-compute diffs if both before and after are provided
    if (params.before && params.after) {
      const changes: Record<string, { old: unknown, new: unknown }> = {}
      for (const key in params.after) {
        // Skip createdAt and updatedAt to avoid noise
        if (key === 'createdAt' || key === 'updatedAt') continue;
        
        if (JSON.stringify(params.before[key]) !== JSON.stringify(params.after[key])) {
          changes[key] = { old: params.before[key], new: params.after[key] }
        }
      }
      if (Object.keys(changes).length > 0) {
        finalDetails = { ...finalDetails, changes }
      }
    }

    // Keep it null if empty so DB is cleaner
    const dbDetails = Object.keys(finalDetails).length > 0 ? finalDetails : null

    await db.insert(activityLogs).values({
      userId: params.userId || null,
      actorName: params.actorName || null,
      actorRole: params.actorRole || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      details: dbDetails,
    })
  } catch (error) {
    // Silent fail — audit logging should never break business operations
    console.error('[AuditLog] Failed to log activity:', error)
  }
}
