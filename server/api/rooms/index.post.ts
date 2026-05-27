import { createRoom } from '../../services/room.service'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const propertyId = body.propertyId

  if (!propertyId || !body.roomNumber || body.monthlyRate === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'propertyId, roomNumber, and monthlyRate are required' })
  }

  await requirePropertyAccess(event.context.user, propertyId)

  const newRoom = await createRoom(event.context.user, propertyId, {
    roomNumber: body.roomNumber,
    monthlyRate: body.monthlyRate,
  })
  
  return apiSuccess(newRoom, 'Room created successfully')
})
