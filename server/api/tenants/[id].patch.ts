import { db } from '../../db'
import { tenants, rooms } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

defineRouteMeta({
  openAPI: {
    tags: ['Tenants'],
    summary: 'Update Tenant Information',
    description: 'Updates a tenant\'s personal details, emergency contacts, or contract status.',
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
    throw createError({ statusCode: 400, statusMessage: 'Tenant ID is required' })
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, id),
    with: { room: true }
  })

  if (!tenant) {
    throw createError({ statusCode: 404, statusMessage: 'Tenant not found' })
  }

  await requirePropertyPermission(event.context.user, tenant.room.propertyId, 'manage_tenants')

  const body = await readBody(event)
  const action = body.action // 'update' or 'checkout'

  if (action === 'checkout') {
    // 1. Mark tenant as inactive
    const [updatedTenant] = await db.update(tenants)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning()
    
    // 2. Mark room as available
    await db.update(rooms)
      .set({ status: 'available', updatedAt: new Date() })
      .where(eq(rooms.id, tenant.roomId))
    
    await logActivity({
      userId: event.context.user.id,
      action: 'CHECK_OUT',
      entityType: 'tenant',
      entityId: id,
      details: { name: tenant.name, room: tenant.room.roomNumber }
    })

    return apiSuccess(updatedTenant, 'Tenant checked out successfully')
  }

  // Normal update
  if (!body.name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const [updated] = await db.update(tenants)
    .set({
      name: body.name,
      phone: body.phone || null,
      provinceId: body.provinceId || null,
      regencyId: body.regencyId || null,
      districtId: body.districtId || null,
      checkIn: new Date(body.checkIn),
      updatedAt: new Date()
    })
    .where(eq(tenants.id, id))
    .returning()

  await logActivity({
    userId: event.context.user.id,
    action: 'UPDATE',
    entityType: 'tenant',
    entityId: id,
    before: tenant,
    after: updated
  })

  return apiSuccess(updated, 'Tenant updated successfully')
})
