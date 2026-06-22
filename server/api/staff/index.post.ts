import { db } from '../../db'
import { userProperties, users } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

defineRouteMeta({
  openAPI: {
    tags: ['Staff'],
    summary: 'Add New Staff',
    description: 'Registers a new staff member account and sends them an initial invitation or sets up their credentials.',
    responses: {
        "201": {
            "description": "Resource successfully created",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "success": {
                                "type": "boolean",
                                "example": true
                            },
                            "message": {
                                "type": "string",
                                "example": "Created successfully"
                            },
                            "data": {
                                "type": "object"
                            }
                        }
                    }
                }
            }
        },
        "400": {
            "description": "Bad Request - Validation error or invalid payload",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "success": {
                                "type": "boolean",
                                "example": false
                            },
                            "statusCode": {
                                "type": "integer",
                                "example": 400
                            },
                            "message": {
                                "type": "string",
                                "example": "Bad Request - Validation error or invalid payload"
                            }
                        }
                    }
                }
            }
        },
        "401": {
            "description": "Unauthorized - Invalid or missing authentication token",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "success": {
                                "type": "boolean",
                                "example": false
                            },
                            "statusCode": {
                                "type": "integer",
                                "example": 401
                            },
                            "message": {
                                "type": "string",
                                "example": "Unauthorized - Invalid or missing authentication token"
                            }
                        }
                    }
                }
            }
        },
        "500": {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "success": {
                                "type": "boolean",
                                "example": false
                            },
                            "statusCode": {
                                "type": "integer",
                                "example": 500
                            },
                            "message": {
                                "type": "string",
                                "example": "Internal Server Error"
                            }
                        }
                    }
                }
            }
        }
    }
  }
})
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { propertyId, email, permissions } = body

  if (!propertyId || !email) {
    throw createError({ statusCode: 400, statusMessage: 'Property ID and Email are required' })
  }

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, propertyId)

  // Find user by email
  const targetUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim())
  })

  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'Email belum terdaftar. Minta calon operator untuk mendaftar terlebih dahulu.' })
  }

  if (targetUser.role === 'superadmin' || targetUser.role === 'owner') {
    throw createError({ statusCode: 400, statusMessage: 'Tidak dapat menugaskan Owner atau Superadmin sebagai operator.' })
  }

  // Check if already assigned to this property
  const existingAssignment = await db.query.userProperties.findFirst({
    where: and(
      eq(userProperties.userId, targetUser.id),
      eq(userProperties.propertyId, propertyId)
    )
  })

  if (existingAssignment) {
    throw createError({ statusCode: 400, statusMessage: 'Operator ini sudah ditugaskan pada properti ini.' })
  }

  // Assign to property
  const defaultPermissions = ['manage_rooms', 'manage_tenants', 'manage_payments', 'manage_expenses', 'view_reports']
  await db.insert(userProperties).values({
    userId: targetUser.id,
    propertyId: propertyId,
    permissions: Array.isArray(permissions) ? permissions : defaultPermissions
  })

  // If role is pending, update to operator
  if (targetUser.role === 'pending') {
    await db.update(users)
      .set({ role: 'operator', updatedAt: new Date() })
      .where(eq(users.id, targetUser.id))
  }

  await logActivity({
    userId: event.context.user.id,
    action: 'HIRE_OPERATOR',
    entityType: 'property',
    entityId: propertyId,
    details: { operatorEmail: targetUser.email }
  })

  return apiSuccess({ user: targetUser }, 'Operator berhasil ditambahkan')
})
