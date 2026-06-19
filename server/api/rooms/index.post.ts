import { createRoom } from '../../services/room.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const propertyId = body.propertyId

  if (!propertyId || !body.roomNumber || body.monthlyRate === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'propertyId, roomNumber, and monthlyRate are required' })
  }

  await requirePropertyPermission(event.context.user, propertyId)

  const newRoom = await createRoom(event.context.user, propertyId, {
    roomNumber: body.roomNumber,
    monthlyRate: body.monthlyRate,
    additionalFees: body.additionalFees,
  })
  
  await logActivity({
    userId: event.context.user.id,
    actorName: event.context.user.name,
    actorRole: event.context.user.role,
    action: 'ADD_ROOM',
    entityType: 'room',
    entityId: newRoom.id,
    details: { roomNumber: newRoom.roomNumber, propertyId },
  })
  
  return apiSuccess(newRoom, 'Room created successfully')
})
