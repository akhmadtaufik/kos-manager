import { db } from '../../db'
import { tenants, rooms } from '../../db/schema'
import { and, eq, inArray, sql, count } from 'drizzle-orm'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined') {
    await requirePropertyAccess(user, propertyId)
    targetPropertyIds = [propertyId]
  } else {
    // Global view
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  if (targetPropertyIds.length === 0) {
    return apiSuccess([])
  }

  // Get active tenants joined with rooms to filter by target properties
  const results = await db.select({
      provinceId: tenants.provinceId,
      total: count()
    })
    .from(tenants)
    .innerJoin(rooms, eq(tenants.roomId, rooms.id))
    .where(
      and(
        eq(tenants.isActive, 1),
        inArray(rooms.propertyId, targetPropertyIds)
      )
    )
    .groupBy(tenants.provinceId)

  // Map null province IDs to "Tidak Diketahui" or something similar if any
  const mapped = results.map(row => ({
    provinceId: row.provinceId || 'unknown',
    total: Number(row.total)
  })).sort((a, b) => b.total - a.total)

  return apiSuccess(mapped)
})
