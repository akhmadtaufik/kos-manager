import { createProperty } from '../../services/property.service'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectPropertySchema, insertPropertySchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Properties'],
    summary: 'Create New Property',
    description: 'Registers a new property/building under the current owner\'s account.',
    responses: {
      201: {
        description: 'Resource successfully created',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: selectPropertySchema })) } }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
})
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Property name is required' })
  }

  const newProperty = await createProperty(user, {
    name: body.name,
    address: body.address,
  })
  
  await logActivity({
    userId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CREATE_PROPERTY',
    entityType: 'property',
    entityId: newProperty.id,
    details: { name: newProperty.name },
  })
  
  return apiSuccess(newProperty, 'Property created successfully')
})
