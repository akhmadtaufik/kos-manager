import { getServerSession } from '#auth'
import { db } from '../db'
import { activityLogs } from '../db/schema'

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  const method = event.node.req.method || ''

  // Match /api/audit, /api/audit?foo=bar, /api/audit/123
  const isAuditRoute = url === '/api/audit' || url.startsWith('/api/audit/') || url.startsWith('/api/audit?')

  if (isAuditRoute && (method === 'DELETE' || method === 'PATCH' || method === 'PUT')) {
    const session = await getServerSession(event)
    const userRole = session?.user ? (session.user as any).role : 'unknown'
    const userId = session?.user ? (session.user as any).id : null
    const actorName = session?.user ? (session.user as any).name : 'Anonymous'

    // Log the tamper attempt
    await db.insert(activityLogs).values({
      userId: userId,
      actorName: actorName,
      actorRole: userRole,
      action: 'TAMPER_ATTEMPT',
      entityType: 'audit',
      details: {
        method,
        url,
        message: 'Operator attempted to delete/modify audit logs'
      }
    })

    console.log(`[Security] Intercepted audit tamper attempt by ${actorName} (${userRole}) via ${method} ${url}`)

    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Audit logs are immutable and append-only.'
    })
  }
})
