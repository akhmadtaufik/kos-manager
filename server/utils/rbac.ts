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

export const MACRO_TO_MICRO_MAP: Record<string, string[]> = {
  manage_rooms: ['rooms:read', 'rooms:create', 'rooms:update', 'rooms:delete'],
  manage_tenants: ['tenants:read', 'tenants:create', 'tenants:update', 'tenants:delete'],
  manage_payments: ['payments:read', 'payments:create', 'payments:update', 'payments:delete'],
  manage_expenses: ['expenses:read', 'expenses:create', 'expenses:update', 'expenses:delete'],
  view_reports: ['reports:read'],
}

export const ALL_MICRO_PERMISSIONS = [
  'rooms:read', 'rooms:create', 'rooms:update', 'rooms:delete',
  'tenants:read', 'tenants:create', 'tenants:update', 'tenants:delete',
  'payments:read', 'payments:create', 'payments:update', 'payments:delete',
  'expenses:read', 'expenses:create', 'expenses:update', 'expenses:delete',
  'reports:read',
]

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
 * Supports granular micro-permissions (e.g. 'rooms:create') and legacy macro permissions ('manage_rooms').
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
    
    const userPermissions = (access.permissions as string[]) || []

    // 1. Direct exact match
    if (userPermissions.includes(permission)) return true

    // 2. If checking a micro-permission (e.g. 'rooms:create'), check if user has corresponding legacy macro (e.g. 'manage_rooms')
    for (const [macro, micros] of Object.entries(MACRO_TO_MICRO_MAP)) {
      if (micros.includes(permission) && userPermissions.includes(macro)) {
        return true
      }
    }

    // 3. If checking a legacy macro (e.g. 'manage_rooms'), check if user has any of the constituent micro-permissions
    if (MACRO_TO_MICRO_MAP[permission]) {
      const constituentMicros = MACRO_TO_MICRO_MAP[permission]!
      if (constituentMicros.some(m => userPermissions.includes(m))) {
        return true
      }
    }

    return false
  }

  return false
}

/**
 * Throws a 403 Forbidden error if the user does not have access to the property.
 */
export async function requirePropertyAccess(user: AuthUser | undefined, propertyId: string): Promise<void> {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const hasAccess = await verifyPropertyAccess(user, propertyId)
  if (!hasAccess) {
    await logActivity({
      userId: user.id,
      actorName: user.name ?? undefined,
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
      actorName: user.name ?? undefined,
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
 */
export async function requirePropertyOwnership(user: AuthUser | undefined, propertyId: string): Promise<void> {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  if (user.role === 'operator') {
    await logActivity({
      userId: user.id,
      actorName: user.name ?? undefined,
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

  const hasAccess = await verifyPropertyAccess(user, propertyId)
  if (!hasAccess) {
    await logActivity({
      userId: user.id,
      actorName: user.name ?? undefined,
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
