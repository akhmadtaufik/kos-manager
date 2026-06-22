import { db } from '../../db'
import { userProperties } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

defineRouteMeta({
  openAPI: {
    tags: ['Staff'],
    summary: 'Remove Staff Member',
    description: 'Revokes access and removes a staff member from the management system.',
    responses: {
        "200": {
            "description": "Resource successfully deleted",
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
                                "example": "Deleted successfully"
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
        "404": {
            "description": "Resource not found",
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
                                "example": 404
                            },
                            "message": {
                                "type": "string",
                                "example": "Resource not found"
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
  const userId = getRouterParam(event, 'userId')
  const query = getQuery(event)
  const propertyId = query.propertyId as string

  if (!userId || !propertyId) {
    throw createError({ statusCode: 400, statusMessage: 'User ID and Property ID are required' })
  }

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, propertyId)

  // Remove the assignment
  const [deleted] = await db.delete(userProperties).where(
    and(
      eq(userProperties.userId, userId),
      eq(userProperties.propertyId, propertyId)
    )
  ).returning()

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Operator assignment not found' })
  }

  await logActivity({
    userId: event.context.user.id,
    action: 'FIRE_OPERATOR',
    entityType: 'property',
    entityId: propertyId,
    details: { firedUserId: userId }
  })

  return apiSuccess(null, 'Akses operator berhasil dicabut')
})
