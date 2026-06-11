import { eq } from 'drizzle-orm'
import { db } from '../db'
import { properties, userProperties } from '../db/schema'
import type { AuthUser } from '../utils/rbac'
import { logActivity } from '../utils/audit'

export async function getUserProperties(user: AuthUser) {
  if (user.role === 'superadmin') {
    return await db.query.properties.findMany({
      orderBy: (props, { desc }) => [desc(props.createdAt)],
    })
  } else if (user.role === 'owner') {
    return await db.query.properties.findMany({
      where: eq(properties.userId, user.id),
      orderBy: (props, { desc }) => [desc(props.createdAt)],
    })
  } else {
    // Operator: get only mapped properties and include permissions
    const mappings = await db.query.userProperties.findMany({
      where: eq(userProperties.userId, user.id),
      with: {
        property: true,
      },
    })
    return mappings.map(m => ({
      ...m.property,
      permissions: m.permissions || []
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

  const [newProperty] = await db.insert(properties).values({
    userId: user.id, // The owner or superadmin who created it
    name: payload.name,
    address: payload.address || null,
  }).returning()

  await logActivity({
    userId: user.id,
    action: 'CREATE',
    entityType: 'property',
    entityId: newProperty.id,
    details: { name: payload.name, address: payload.address },
  })

  // Automatically assign the creator to the property in userProperties
  await db.insert(userProperties).values({
    userId: user.id,
    propertyId: newProperty.id,
  })

  return newProperty
}
