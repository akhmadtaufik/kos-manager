import { createProperty } from '../../services/property.service'
import { apiSuccess } from '../../utils/response'

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
  
  return apiSuccess(newProperty, 'Property created successfully')
})
