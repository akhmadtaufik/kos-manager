import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../db'
import { properties, rooms, userProperties, users } from '../db/schema'
import type { AuthUser } from '../utils/rbac'
import { logActivity } from '../utils/audit'

export async function getUserProperties(user: AuthUser) {
  if (user.role === 'superadmin') {
    const rows = await db
      .select({
        id: properties.id,
        userId: properties.userId,
        name: properties.name,
        address: properties.address,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        totalRooms: sql<number>`cast(count(${rooms.id}) as int)`,
        occupiedRooms: sql<number>`cast(count(case when ${rooms.status} = 'occupied' then 1 end) as int)`,
      })
      .from(properties)
      .leftJoin(rooms, eq(rooms.propertyId, properties.id))
      .groupBy(properties.id)
      .orderBy(desc(properties.createdAt))

    return rows
  } else if (user.role === 'owner') {
    const rows = await db
      .select({
        id: properties.id,
        userId: properties.userId,
        name: properties.name,
        address: properties.address,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        totalRooms: sql<number>`cast(count(${rooms.id}) as int)`,
        occupiedRooms: sql<number>`cast(count(case when ${rooms.status} = 'occupied' then 1 end) as int)`,
      })
      .from(properties)
      .leftJoin(rooms, eq(rooms.propertyId, properties.id))
      .where(eq(properties.userId, user.id))
      .groupBy(properties.id)
      .orderBy(desc(properties.createdAt))

    return rows
  } else {
    // Operator: get only mapped properties and include permissions + room metrics
    const rows = await db
      .select({
        id: properties.id,
        userId: properties.userId,
        name: properties.name,
        address: properties.address,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
        permissions: userProperties.permissions,
        totalRooms: sql<number>`cast(count(${rooms.id}) as int)`,
        occupiedRooms: sql<number>`cast(count(case when ${rooms.status} = 'occupied' then 1 end) as int)`,
      })
      .from(userProperties)
      .innerJoin(properties, eq(properties.id, userProperties.propertyId))
      .leftJoin(rooms, eq(rooms.propertyId, properties.id))
      .where(eq(userProperties.userId, user.id))
      .groupBy(properties.id, userProperties.permissions)
      .orderBy(desc(properties.createdAt))

    return rows.map(r => ({
      ...r,
      permissions: (r.permissions as string[]) || []
    }))
  }
}

export async function createProperty(user: AuthUser, payload: { name: string; address?: string }) {
  if (user.role !== 'superadmin' && user.role !== 'owner') {
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden: Only owners and superadmins can create properties' 
    })
  }

  // Ensure the user exists in database to prevent foreign key violations on invalid sessions
  const userExists = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  })
  if (!userExists) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sesi pengguna tidak valid. Silakan login kembali.',
    })
  }

  const [newProperty] = await db.insert(properties).values({
    userId: user.id, // The owner or superadmin who created it
    name: payload.name,
    address: payload.address || null,
  }).returning()

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'property',
    entityId: newProperty!.id,
    details: { name: payload.name, address: payload.address },
  })

  // Automatically assign the creator to the property in userProperties
  await db.insert(userProperties).values({
    userId: user.id,
    propertyId: newProperty!.id,
  })

  return newProperty!
}
