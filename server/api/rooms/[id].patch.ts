import { db } from '../../db'
import { rooms } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { selectRoomSchema, insertRoomSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Rooms'],
    summary: 'Update Room Details',
    description: 'Modifies attributes of an existing room, such as price, capacity, status (available/maintenance), or facilities.'
  }
})
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Room ID is required' })
  }

  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, id) })
  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })
  }

  // Must have manage_rooms permission for the property this room belongs to
  await requirePropertyPermission(event.context.user, room.propertyId, 'manage_rooms')

  const body = await readBody(event)
  if (!body.roomNumber || !body.monthlyRate) {
    throw createError({ statusCode: 400, statusMessage: 'roomNumber and monthlyRate are required' })
  }

  const [updated] = await db.update(rooms)
    .set({
      roomNumber: body.roomNumber,
      monthlyRate: String(body.monthlyRate),
      additionalFees: body.additionalFees !== undefined ? body.additionalFees : room.additionalFees,
      updatedAt: new Date()
    })
    .where(eq(rooms.id, id))
    .returning()

  await logActivity({
    userId: event.context.user.id,
    action: 'UPDATE',
    entityType: 'room',
    entityId: id,
    before: room,
    after: updated
  })

  return apiSuccess(updated, 'Room updated successfully')
})
