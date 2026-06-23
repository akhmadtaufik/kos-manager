import { db } from '../../db'
import { rooms } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectRoomSchema, insertRoomSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Rooms'],
    summary: 'Delete Room',
    description: 'Removes a specific room from a property. Cannot be deleted if currently occupied by a tenant.',
    responses: {
      200: {
        description: 'Resource successfully deleted',
        content: { 'application/json': { schema:  { $ref: '#/components/responses/SuccessResponse/content/application/json/schema' }  } }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
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

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, room.propertyId)

  try {
    const [deleted] = await db.delete(rooms).where(eq(rooms.id, id)).returning()

    if (deleted) {
      await logActivity({
        userId: event.context.user.id,
        action: 'DELETE',
        entityType: 'room',
        entityId: id,
        details: { roomNumber: deleted.roomNumber }
      })
    }

    return apiSuccess(deleted, 'Room deleted successfully')
  } catch (error: any) {
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tolak Hapus: Kamar ini masih memiliki riwayat Penghuni atau Tagihan. Kosongkan data terkait terlebih dahulu.'
      })
    }
    throw error
  }
})
