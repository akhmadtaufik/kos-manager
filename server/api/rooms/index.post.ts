import { createRoom } from '../../services/room.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectRoomSchema, insertRoomSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Rooms'],
    summary: 'Create New Room',
    description: 'Adds a new room to a specific property, defining its base price, capacity, and identifying number/name.',
    responses: {
      201: {
        description: 'Resource successfully created',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: selectRoomSchema })) } }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
})
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
