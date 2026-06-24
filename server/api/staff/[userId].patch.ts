import { db } from '../../db'
import { userProperties } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { selectUserSchema, insertUserSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Staff'],
    summary: 'Update Staff Details',
    description: 'Updates a staff member\'s profile, contact information, or assigned responsibilities.'
  }
})
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  const query = getQuery(event)
  const propertyId = query.propertyId as string

  if (!userId || !propertyId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID and Property ID are required' })
  }

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, propertyId)

  const body = await readBody(event)
  const { permissions } = body

  if (!Array.isArray(permissions)) {
    throw createError({ statusCode: 400, statusMessage: 'Permissions must be an array' })
  }

  // Check if assigned to this property
  const existingAssignment = await db.query.userProperties.findFirst({
    where: and(
      eq(userProperties.userId, userId),
      eq(userProperties.propertyId, propertyId)
    )
  })

  if (!existingAssignment) {
    throw createError({ statusCode: 404, statusMessage: 'Operator not found on this property.' })
  }

  // Update permissions
  await db.update(userProperties)
    .set({ permissions })
    .where(and(
      eq(userProperties.userId, userId),
      eq(userProperties.propertyId, propertyId)
    ))

  await logActivity({
    userId: event.context.user.id,
    action: 'UPDATE_OPERATOR_PERMISSIONS',
    entityType: 'property',
    entityId: propertyId,
    details: { operatorId: userId, permissions }
  })

  return apiSuccess(null, 'Hak akses operator berhasil diperbarui')
})
