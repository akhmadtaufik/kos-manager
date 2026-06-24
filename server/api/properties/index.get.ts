import { getUserProperties } from '../../services/property.service'
import { apiSuccess } from '../../utils/response'
import { selectPropertySchema, insertPropertySchema, createPaginatedSchema } from '../../utils/validations'



defineRouteMeta({
  openAPI: {
    tags: ['Properties'],
    summary: 'Retrieve all properties',
    description: 'Fetches a list of all properties belonging to the authenticated user.'
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
