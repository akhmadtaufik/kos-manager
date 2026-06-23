import { getUserProperties } from '../../services/property.service'
import { apiSuccess } from '../../utils/response'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectPropertySchema, insertPropertySchema, createPaginatedSchema } from '../../utils/validations'



defineRouteMeta({
  openAPI: {
    tags: ['Properties'],
    summary: 'Retrieve all properties',
    description: 'Fetches a list of all properties belonging to the authenticated user.',
    responses: {
      200: {
        description: 'Successful retrieval of data',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: createPaginatedSchema(selectPropertySchema) })) } }
      },
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

  const properties = await getUserProperties(user)
  
  return sendSuccessResponse(event, properties, 200, 'Properties retrieved successfully')
})
