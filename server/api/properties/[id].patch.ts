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
    summary: 'Update Property Details',
    description: 'Updates information for an existing property, such as name, address, or facilities.',
    responses: {
      200: {
        description: 'Resource successfully updated',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: selectPropertySchema })) } }
      },
      400: { $ref: '#/components/responses/ValidationError' },
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

  const body = await readBody(event)
  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Property name is required' })
  }

  const [updated] = await db.update(properties)
    .set({
      name: body.name,
      address: body.address || null,
      updatedAt: new Date()
    })
    .where(eq(properties.id, id))
    .returning()

  await logActivity({
    userId: event.context.user.id,
    action: 'UPDATE',
    entityType: 'property',
    entityId: id,
    details: { name: body.name }
  })

  return apiSuccess(updated, 'Property updated successfully')
})
