import { db } from '../../db'
import { properties } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectPropertySchema, insertPropertySchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Properties'],
    summary: 'Delete Property',
    description: 'Removes a property from the system. Note: This may fail if there are active rooms or tenants associated with the property.',
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
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Property ID is required' })
  }

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, id)

  try {
    const [deleted] = await db.delete(properties).where(eq(properties.id, id)).returning()

    if (deleted) {
      await logActivity({
        userId: event.context.user.id,
        action: 'DELETE',
        entityType: 'property',
        entityId: id,
        details: { name: deleted.name }
      })
    }

    return apiSuccess(deleted, 'Property deleted successfully')
  } catch (error: any) {
    // Check for foreign key constraint violation
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tolak Hapus: Properti ini masih memiliki Kamar, Penghuni, atau Tagihan aktif. Silakan hapus data terkait terlebih dahulu.'
      })
    }
    throw error
  }
})
