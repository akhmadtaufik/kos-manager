import { db } from '../db'
import { userProperties, properties } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import { logActivity } from './audit'

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
 * Checks if a user has a specific permission for a property.
 */
export async function verifyPropertyPermission(user: AuthUser, propertyId: string, permission: string): Promise<boolean> {
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

    if (!access || !access.permissions) return false
    
    // Check if permissions array contains the required permission
    const permissions = access.permissions as string[]
    return permissions.includes(permission)
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
    await logActivity({
      userId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'UNAUTHORIZED_ATTEMPT',
      entityType: 'property',
      entityId: propertyId,
      details: { reason: 'Attempted to access a property without basic access rights' }
    })
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden: You do not have access to this property' 
    })
  }
}

/**
 * Throws a 403 Forbidden error if the user does not have the specific permission for the property.
 */
export async function requirePropertyPermission(user: AuthUser | undefined, propertyId: string, permission: string): Promise<void> {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const hasPermission = await verifyPropertyPermission(user, propertyId, permission)
  if (!hasPermission) {
    await logActivity({
      userId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'UNAUTHORIZED_ATTEMPT',
      entityType: 'property',
      entityId: propertyId,
      details: { reason: `Attempted an action requiring '${permission}' permission` }
    })
    throw createError({ 
      statusCode: 403, 
      statusMessage: `Forbidden: You do not have the required permission (${permission}) for this property` 
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
    await logActivity({
      userId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'UNAUTHORIZED_ATTEMPT',
      entityType: 'property',
      entityId: propertyId,
      details: { reason: 'Operator attempted to perform an owner-only action (Ownership check failed)' }
    })
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden: Operators cannot perform this action' 
    })
  }

  // Still verify they actually own this specific property (or are superadmin)
  const hasAccess = await verifyPropertyAccess(user, propertyId)
  if (!hasAccess) {
    await logActivity({
      userId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'UNAUTHORIZED_ATTEMPT',
      entityType: 'property',
      entityId: propertyId,
      details: { reason: 'Attempted an owner-only action without property access' }
    })
    throw createError({ 
      statusCode: 403, 
      statusMessage: 'Forbidden: You do not have access to this property' 
    })
  }
}
