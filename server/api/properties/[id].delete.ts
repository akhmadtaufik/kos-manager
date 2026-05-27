import { db } from '../../db'
import { properties } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Property ID is required' })
  }

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, id)

  try {
    const [deleted] = await db.delete(properties).where(eq(properties.id, id)).returning()

    if (deleted) {
      await logActivity({
        userId: event.context.user.id,
        action: 'DELETE',
        entityType: 'property',
        entityId: id,
        details: { name: deleted.name }
      })
    }

    return apiSuccess(deleted, 'Property deleted successfully')
  } catch (error: any) {
    // Check for foreign key constraint violation
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tolak Hapus: Properti ini masih memiliki Kamar, Penghuni, atau Tagihan aktif. Silakan hapus data terkait terlebih dahulu.'
      })
    }
    throw error
  }
})
