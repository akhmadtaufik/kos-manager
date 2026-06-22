import { db } from '../../db'
import { userProperties } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

defineRouteMeta({
  openAPI: {
    tags: ['Staff'],
    summary: 'Update Staff Details',
    description: 'Updates a staff member\'s profile, contact information, or assigned responsibilities.',
    responses: {
        "200": {
            "description": "Resource successfully updated",
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
                                "example": "Updated successfully"
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
            "description": "Bad Request - Validation error or missing fields",
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
                                "example": "Bad Request - Validation error or missing fields"
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

  const body = await readBody(event)
  const { permissions } = body

  if (!Array.isArray(permissions)) {
    throw createError({ statusCode: 400, statusMessage: 'Permissions must be an array' })
  }

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
    details: { operatorId: userId, permissions }
  })

  return apiSuccess(null, 'Hak akses operator berhasil diperbarui')
})
