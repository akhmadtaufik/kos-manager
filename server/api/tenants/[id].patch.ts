import { db } from '../../db'
import { tenants, rooms } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Tenant ID is required' })
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, id),
    with: { room: true }
  })

  if (!tenant) {
    throw createError({ statusCode: 404, statusMessage: 'Tenant not found' })
  }

  await requirePropertyAccess(event.context.user, tenant.room.propertyId)

  const body = await readBody(event)
  const action = body.action // 'update' or 'checkout'

  if (action === 'checkout') {
    // 1. Mark tenant as inactive
    const [updatedTenant] = await db.update(tenants)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning()
    
    // 2. Mark room as available
    await db.update(rooms)
      .set({ status: 'available', updatedAt: new Date() })
      .where(eq(rooms.id, tenant.roomId))
    
    await logActivity({
      userId: event.context.user.id,
      action: 'CHECK_OUT',
      entityType: 'tenant',
      entityId: id,
      details: { name: tenant.name, room: tenant.room.roomNumber }
    })

    return apiSuccess(updatedTenant, 'Tenant checked out successfully')
  }

  // Normal update
  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const [updated] = await db.update(tenants)
    .set({
      name: body.name,
      phone: body.phone || null,
      checkIn: new Date(body.checkIn),
      updatedAt: new Date()
    })
    .where(eq(tenants.id, id))
    .returning()

  await logActivity({
    userId: event.context.user.id,
    action: 'UPDATE',
    entityType: 'tenant',
    entityId: id,
    details: { name: body.name }
  })

  return apiSuccess(updated, 'Tenant updated successfully')
})
