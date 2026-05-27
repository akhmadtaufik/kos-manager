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

  const body = await readBody(event)
  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Property name is required' })
  }

  const [updated] = await db.update(properties)
    .set({
      name: body.name,
      address: body.address || null,
      updatedAt: new Date()
    })
    .where(eq(properties.id, id))
    .returning()

  await logActivity({
    userId: event.context.user.id,
    action: 'UPDATE',
    entityType: 'property',
    entityId: id,
    details: { name: body.name }
  })

  return apiSuccess(updated, 'Property updated successfully')
})
