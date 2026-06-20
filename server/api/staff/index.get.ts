import { db } from '../../db'
import { userProperties, users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string

  if (!propertyId) {
    throw createError({ statusCode: 400, statusMessage: 'Property ID is required' })
  }

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, propertyId)

  const staffList = await db.query.userProperties.findMany({
    where: eq(userProperties.propertyId, propertyId),
    with: {
      user: true
    }
  })

  // Format to return just the user objects with the assignedAt date and permissions
  const formatted = staffList
    .filter(item => item.user && item.user.role !== 'owner')
    .map(item => ({
      ...item.user,
      assignedAt: item.assignedAt,
      permissions: item.permissions || []
    }))

  return apiSuccess(formatted, 'Staff list retrieved successfully')
})
