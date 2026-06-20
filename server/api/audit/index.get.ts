import { db } from '../../db'
import { activityLogs, properties, userProperties } from '../../db/schema'
import { eq, desc, and, inArray, SQL, count } from 'drizzle-orm'
import { getServerSession } from '#auth'

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
  const operatorIdFilter = query.operatorId as string // Specific operator
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const offset = (page - 1) * limit

  const conditions: SQL[] = []

  if (roleFilter && roleFilter !== 'all') {
    conditions.push(eq(activityLogs.actorRole, roleFilter))
  }
  
  if (operatorIdFilter) {
    conditions.push(eq(activityLogs.userId, operatorIdFilter))
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
    
    // 3. The valid user IDs are the owner's ID + operator IDs
    const validUserIds = [userId, ...operatorIds].filter(Boolean)
    
    // 4. Exclude 'system' and restrict to valid users (if not explicitly querying a specific operator)
    if (validUserIds.length > 0 && !operatorIdFilter) {
      conditions.push(inArray(activityLogs.userId, validUserIds))
    } else if (!operatorIdFilter) {
      // If no valid users (shouldn't happen since userId is there, but just in case)
      conditions.push(eq(activityLogs.userId, userId))
    }
    
    // Security Check: If requesting a specific operator, ensure they belong to this owner
    if (operatorIdFilter && !validUserIds.includes(operatorIdFilter)) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: Cannot access logs for this operator' })
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Fetch paginated logs
  const logs = await db.query.activityLogs.findMany({
    where: whereClause,
    orderBy: [desc(activityLogs.createdAt)],
    limit,
    offset,
  })

  // Count total for pagination (True Database Count)
  const [{ total }] = await db.select({ total: count() })
    .from(activityLogs)
    .where(whereClause)

  return {
    data: logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
})
