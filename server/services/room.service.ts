import { eq, inArray, desc } from 'drizzle-orm'
import { db } from '../db'
import { rooms, tenants } from '../db/schema'
import type { AuthUser } from '../utils/rbac'
import { logActivity } from '../utils/audit'

export async function getRooms(propertyIds: string[]) {
  if (propertyIds.length === 0) return []
  return await db.query.rooms.findMany({
    where: inArray(rooms.propertyId, propertyIds),
    orderBy: [desc(rooms.createdAt)],
    with: {
      property: true,
      tenants: {
        where: eq(tenants.isActive, 1),
        limit: 1,
      },
    },
  })
}

export async function createRoom(user: AuthUser, propertyId: string, payload: { roomNumber: string; monthlyRate: string | number }) {
  const [newRoom] = await db.insert(rooms).values({
    propertyId,
    roomNumber: payload.roomNumber,
    monthlyRate: String(payload.monthlyRate),
  }).returning()

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'room',
    entityId: newRoom.id,
    details: { propertyId, roomNumber: payload.roomNumber },
  })

  return newRoom
}
