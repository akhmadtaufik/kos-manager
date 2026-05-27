import { db } from '../db'
import { userProperties, properties } from '../db/schema'
import { and, eq } from 'drizzle-orm'

export interface AuthUser {
  id: string
  role: string
  name?: string | null
  email?: string | null
}

/**
 * Checks if a user has access to a specific property.
 * Superadmins have access to all properties.
 * Owners have access to properties they created.
 * Operators only have access if mapped in the user_properties table.
 */
export async function verifyPropertyAccess(user: AuthUser, propertyId: string): Promise<boolean> {
  if (user.role === 'superadmin') {
    return true
  }

  if (user.role === 'owner') {
    const property = await db.query.properties.findFirst({
      where: and(
        eq(properties.id, propertyId),
        eq(properties.userId, user.id)
      ),
    })
    return !!property
  }

  if (user.role === 'operator') {
    const access = await db.query.userProperties.findFirst({
      where: and(
        eq(userProperties.userId, user.id),
        eq(userProperties.propertyId, propertyId)
      ),
    })

    return !!access
  }

  return false
}

/**
 * Throws a 403 Forbidden error if the user does not have access to the property.
 * Useful for fast-failing inside API handlers.
 */
export async function requirePropertyAccess(user: AuthUser | undefined, propertyId: string): Promise<void> {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const hasAccess = await verifyPropertyAccess(user, propertyId)
  if (!hasAccess) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden: You do not have access to this property' 
    })
  }
}

/**
 * Throws a 403 Forbidden error if the user is an operator.
 * Useful for admin actions like editing/deleting a property or room.
 */
export async function requirePropertyOwnership(user: AuthUser | undefined, propertyId: string): Promise<void> {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  if (user.role === 'operator') {
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden: Operators cannot perform this action' 
    })
  }

  // Still verify they actually own this specific property (or are superadmin)
  const hasAccess = await verifyPropertyAccess(user, propertyId)
  if (!hasAccess) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden: You do not have access to this property' 
    })
  }
}
