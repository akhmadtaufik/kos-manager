import { db } from '../../db'
import { userProperties } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectUserSchema, insertUserSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Staff'],
    summary: 'Remove Staff Member',
    description: 'Revokes access and removes a staff member from the management system.',
    responses: {
      200: {
        description: 'Resource successfully deleted',
        content: { 'application/json': { schema:  { $ref: '#/components/responses/SuccessResponse/content/application/json/schema' }  } }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
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

  // Remove the assignment
  const [deleted] = await db.delete(userProperties).where(
    and(
      eq(userProperties.userId, userId),
      eq(userProperties.propertyId, propertyId)
    )
  ).returning()

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Operator assignment not found' })
  }

  await logActivity({
    userId: event.context.user.id,
    action: 'FIRE_OPERATOR',
    entityType: 'property',
    entityId: propertyId,
    details: { firedUserId: userId }
  })

  return apiSuccess(null, 'Akses operator berhasil dicabut')
})
