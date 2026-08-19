import { db } from '../../db'
import { userProperties } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { requirePropertyOwnership, ALL_MICRO_PERMISSIONS, MACRO_TO_MICRO_MAP } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { z } from 'zod'

const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()).refine(
    (perms) => perms.every(p => ALL_MICRO_PERMISSIONS.includes(p) || Boolean(MACRO_TO_MICRO_MAP[p])),
    { message: 'Terdapat hak akses yang tidak valid' }
  )
})

defineRouteMeta({
  openAPI: {
    tags: ['Staff'],
    summary: 'Update Staff Permissions',
    description: 'Updates a staff member\'s granular access rights and micro-permissions for a specific property.'
  }
})

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  const query = getQuery(event)
  const propertyId = query.propertyId as string

  if (!userId || !propertyId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID and Property ID are required' })
  }

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, propertyId)

  const body = await readBody(event)
  const parseResult = updatePermissionsSchema.safeParse(body)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parseResult.error.issues[0]?.message || 'Invalid permissions format'
    })
  }

  const { permissions } = parseResult.data

  // Check if assigned to this property
  const existingAssignment = await db.query.userProperties.findFirst({
    where: and(
      eq(userProperties.userId, userId),
      eq(userProperties.propertyId, propertyId)
    )
  })

  if (!existingAssignment) {
    throw createError({ statusCode: 404, statusMessage: 'Operator not found on this property.' })
  }

  // Update permissions
  await db.update(userProperties)
    .set({ permissions })
    .where(and(
      eq(userProperties.userId, userId),
      eq(userProperties.propertyId, propertyId)
    ))

  await logActivity({
    userId: event.context.user.id,
    action: 'UPDATE_OPERATOR_PERMISSIONS',
    entityType: 'property',
    entityId: propertyId,
    details: { 
      operatorId: userId,
      changes: {
        permissions: {
          old: existingAssignment.permissions,
          new: permissions
        }
      }
    }
  })

  return apiSuccess(null, 'Hak akses operator berhasil diperbarui')
})
