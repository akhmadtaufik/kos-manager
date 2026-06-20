import { db } from '../../db'
import { properties, userProperties, users } from '../../db/schema'
import { eq, inArray } from 'drizzle-orm'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userRole = (session.user as any).role
  const userId = (session.user as any).id

  if (userRole === 'operator') {
    // Operators only see themselves
    const op = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, name: true, role: true }
    })
    return { data: op ? [op] : [] }
  }

  if (userRole === 'owner') {
    // Owners see all operators associated with their properties
    const ownerProperties = await db.select({ id: properties.id }).from(properties).where(eq(properties.userId, userId))
    const propertyIds = ownerProperties.map(p => p.id)
    
    if (propertyIds.length === 0) {
      return { data: [] }
    }

    const assignments = await db.select({ userId: userProperties.userId })
      .from(userProperties)
      .where(inArray(userProperties.propertyId, propertyIds))
    
    const operatorIds = [...new Set(assignments.map(a => a.userId))]

    if (operatorIds.length === 0) {
      return { data: [] }
    }

    const ops = await db.query.users.findMany({
      where: inArray(users.id, operatorIds),
      columns: { id: true, name: true, role: true }
    })

    return { data: ops }
  }

  return { data: [] }
})
