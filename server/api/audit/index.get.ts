import { db } from '../../db'
import { activityLogs, properties, userProperties } from '../../db/schema'
import { eq, desc, and, inArray, SQL, count, isNotNull } from 'drizzle-orm'
import { getServerSession } from '#auth'
import { sendSuccessResponse } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Audit'],
    summary: 'List Audit Logs',
    description: 'Retrieves a comprehensive list of human-generated audit logs, tracking administrative actions, property modifications, and security events.'
  }
})

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userRole = (session.user as any).role
  const userId = (session.user as any).id
  if (userRole !== 'owner' && userRole !== 'superadmin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Owners only' })
  }

  const query = getQuery(event)
  const roleFilter = query.role as string // 'all', 'owner', 'operator'
  const actorIdFilter = (query.actorId as string) || (query.operatorId as string) // Specific actor (operator or owner)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 15
  const offset = (page - 1) * limit

  const conditions: SQL[] = []

  // Anti-Fraud Requirement: Strictly exclude system-generated automated logs
  conditions.push(isNotNull(activityLogs.userId))
  conditions.push(isNotNull(activityLogs.actorRole))

  if (roleFilter && roleFilter !== 'all') {
    conditions.push(eq(activityLogs.actorRole, roleFilter))
  }

  if (userRole === 'owner') {
    // 1. Get properties owned by this owner
    const ownerProperties = await db.select({ id: properties.id }).from(properties).where(eq(properties.userId, userId))
    const propertyIds = ownerProperties.map(p => p.id)
    
    // 2. Get operators associated with these properties
    let operatorIds: string[] = []
    if (propertyIds.length > 0) {
       const ops = await db.select({ userId: userProperties.userId }).from(userProperties).where(inArray(userProperties.propertyId, propertyIds))
       operatorIds = ops.map(o => o.userId)
    }
    
    // 3. The valid human user IDs for this owner's audit trail: Owner itself + assigned operators
    const validUserIds = [userId, ...operatorIds].filter(Boolean)
    
    if (actorIdFilter) {
      // Security Check: If filtering by a specific actor, ensure they belong to this owner
      if (!validUserIds.includes(actorIdFilter)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Cannot access logs for this actor' })
      }
      conditions.push(eq(activityLogs.userId, actorIdFilter))
    } else {
      if (validUserIds.length > 0) {
        conditions.push(inArray(activityLogs.userId, validUserIds))
      } else {
        conditions.push(eq(activityLogs.userId, userId))
      }
    }
  } else if (actorIdFilter) {
    // Superadmin filtering by specific actor
    conditions.push(eq(activityLogs.userId, actorIdFilter))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Fetch paginated logs
  const logs = await db.query.activityLogs.findMany({
    where: whereClause,
    orderBy: [desc(activityLogs.createdAt)],
    limit,
    offset,
  })

  // Count total for pagination
  const countResult = await db.select({ total: count() })
    .from(activityLogs)
    .where(whereClause)
  const total = countResult[0]?.total || 0

  return sendSuccessResponse(event, {
    data: logs,
    meta: {
      page,
      limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / limit)
    }
  }, 200, 'Audit logs retrieved successfully')
})
