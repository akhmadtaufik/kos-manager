import { db } from '../../db'
import { properties } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyOwnership } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

defineRouteMeta({
  openAPI: {
    tags: ['Properties'],
    summary: 'Update Property Details',
    description: 'Updates information for an existing property, such as name, address, or facilities.',
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
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Property ID is required' })
  }

  // Must be owner or superadmin
  await requirePropertyOwnership(event.context.user, id)

  const body = await readBody(event)
  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Property name is required' })
  }

  const [updated] = await db.update(properties)
    .set({
      name: body.name,
      address: body.address || null,
      updatedAt: new Date()
    })
    .where(eq(properties.id, id))
    .returning()

  await logActivity({
    userId: event.context.user.id,
    action: 'UPDATE',
    entityType: 'property',
    entityId: id,
    details: { name: body.name }
  })

  return apiSuccess(updated, 'Property updated successfully')
})
