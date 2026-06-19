import { db } from '../../db'
import { activityLogs, properties, userProperties } from '../../db/schema'
import { eq, desc, and, inArray, SQL } from 'drizzle-orm'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    console.log('[Audit API] 401 Unauthorized - No Session User')
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userRole = (session.user as any).role
  const userId = (session.user as any).id
  if (userRole !== 'owner' && userRole !== 'superadmin') {
    console.log(`[Audit API] 403 Forbidden - Role is ${userRole}`)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Owners only' })
  }

  const query = getQuery(event)
  const roleFilter = query.role as string // 'all', 'owner', 'operator'
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const offset = (page - 1) * limit

  const conditions: SQL[] = []

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
    
    // 3. The valid user IDs are the owner's ID + operator IDs
    const validUserIds = [userId, ...operatorIds].filter(Boolean)
    
    console.log(`[Audit API DEBUG] Session userId: ${userId}, Property IDs: ${propertyIds.join(',')}, Operator IDs: ${operatorIds.join(',')}, Valid User IDs: ${validUserIds.join(',')}`)
    
    // 4. Exclude 'system' and restrict to valid users
    if (validUserIds.length > 0) {
      conditions.push(inArray(activityLogs.userId, validUserIds))
    } else {
      // If no valid users (shouldn't happen since userId is there, but just in case)
      conditions.push(eq(activityLogs.userId, userId))
    }
  }

  // Fetch paginated logs
  const logs = await db.query.activityLogs.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(activityLogs.createdAt)],
    limit,
    offset,
  })

  // Count total for pagination
  // This is a naive count; for ultra-scale we might use a separate count query or an estimate
  const totalLogs = await db.select({ id: activityLogs.id }).from(activityLogs).where(conditions.length > 0 ? and(...conditions) : undefined)

  console.log(`[Audit API] roleFilter: ${roleFilter}, logs found: ${logs.length}, total: ${totalLogs.length}`)

  return {
    data: logs,
    meta: {
      page,
      limit,
      total: totalLogs.length,
      totalPages: Math.ceil(totalLogs.length / limit)
    }
  }
})
