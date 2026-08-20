import { z } from 'zod'
import { getUserProperties } from '../../services/property.service'
import { selectPropertyWithMetricsSchema } from '../../utils/schemaValidations'
import { sendSuccessResponse } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Properties'],
    summary: 'Retrieve all properties with aggregated metrics',
    description: 'Fetches a list of all properties belonging to the authenticated user along with total rooms and occupied rooms.'
  }
})
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const properties = await getUserProperties(user)
  const validated = z.array(selectPropertyWithMetricsSchema).parse(properties)
  
  return sendSuccessResponse(event, validated, 200, 'Properties retrieved successfully')
})
