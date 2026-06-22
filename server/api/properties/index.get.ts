import { getUserProperties } from '../../services/property.service'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    summary: 'Retrieve all properties',
    description: 'Fetches a list of all properties belonging to the authenticated user.',
    tags: ['Properties'],
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Properties retrieved successfully' },
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
                      name: { type: 'string', example: 'Kost Mawar' },
                      address: { type: 'string', example: 'Jl. Melati No. 1' },
                      ownerId: { type: 'string', format: 'uuid', example: 'owner-uuid' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      401: {
        description: 'Unauthorized'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const properties = await getUserProperties(user)
  
  return apiSuccess(properties, 'Properties retrieved successfully')
})
