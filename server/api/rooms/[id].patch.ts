import { db } from '../../db'
import { rooms } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Room ID is required' })
  }

  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, id) })
  if (!room) {
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })
  }

  // Must be owner or superadmin of the property this room belongs to
  await requirePropertyOwnership(event.context.user, room.propertyId)

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
    details: { roomNumber: body.roomNumber, monthlyRate: body.monthlyRate }
  })

  return apiSuccess(updated, 'Room updated successfully')
})
