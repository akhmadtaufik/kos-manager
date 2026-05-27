import { getUserProperties } from '../../services/property.service'
import { apiSuccess } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const properties = await getUserProperties(user)
  
  return apiSuccess(properties, 'Properties retrieved successfully')
})
