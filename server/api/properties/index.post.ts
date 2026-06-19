import { createProperty } from '../../services/property.service'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

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
