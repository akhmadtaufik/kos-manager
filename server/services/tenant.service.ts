import { eq, inArray, desc, and } from 'drizzle-orm'
import { db } from '../db'
import { tenants, rooms } from '../db/schema'
import type { AuthUser } from '../utils/rbac'
import { logActivity } from '../utils/audit'

export async function getTenantsByProperty(propertyIds: string[]) {
  if (propertyIds.length === 0) return []
  
  const propertyRooms = await db.query.rooms.findMany({
    where: inArray(rooms.propertyId, propertyIds),
    with: {
      property: true,
      tenants: {
        orderBy: [desc(tenants.createdAt)],
      },
    },
  })

  // Flatten the tenants array
  const allTenants = propertyRooms.flatMap(room => 
    room.tenants.map(tenant => ({
      ...tenant,
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        property: room.property
      }
    }))
  )

  return allTenants
}

export async function createTenant(user: AuthUser, propertyId: string, payload: { 
  roomId: string; 
  name: string; 
  phone?: string;
  provinceId?: string;
  regencyId?: string;
  districtId?: string;
  checkIn: string;
}) {
  // Verify the room actually belongs to the specified property
  const room = await db.query.rooms.findFirst({
    where: and(eq(rooms.id, payload.roomId), eq(rooms.propertyId, propertyId))
  })

  if (!room) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid room for this property' })
  }

  // Use a transaction to insert tenant AND update room status
  const newTenant = await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(tenants).values({
      roomId: payload.roomId,
      name: payload.name,
      phone: payload.phone || null,
      provinceId: payload.provinceId || null,
      regencyId: payload.regencyId || null,
      districtId: payload.districtId || null,
      checkIn: new Date(payload.checkIn),
      isActive: 1,
    }).returning()

    await tx.update(rooms)
      .set({ status: 'occupied', updatedAt: new Date() })
      .where(eq(rooms.id, payload.roomId))

    return inserted
  })

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'tenant',
    entityId: newTenant.id,
    details: { propertyId, roomId: payload.roomId, name: payload.name },
  })

  return newTenant
}
