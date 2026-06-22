import { createTenant } from '../../services/tenant.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

defineRouteMeta({
  openAPI: {
    tags: ['Tenants'],
    summary: 'Register New Tenant',
    description: 'Registers a new tenant, capturing their personal data, identity documents, and assigning them to a specific room.',
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
  const propertyId = body.propertyId

  if (!propertyId || !body.roomId || !body.name || !body.checkIn) {
    throw createError({ statusCode: 400, statusMessage: 'propertyId, roomId, name, and checkIn are required' })
  }

  await requirePropertyPermission(event.context.user, propertyId, 'manage_tenants')

  const newTenant = await createTenant(event.context.user, propertyId, {
    roomId: body.roomId,
    name: body.name,
    phone: body.phone,
    provinceId: body.provinceId,
    regencyId: body.regencyId,
    districtId: body.districtId,
    checkIn: body.checkIn,
  })
  
  await logActivity({
    userId: event.context.user.id,
    actorName: event.context.user.name,
    actorRole: event.context.user.role,
    action: 'CHECKIN_TENANT',
    entityType: 'tenant',
    entityId: newTenant.id,
    details: { name: newTenant.name, propertyId, roomId: newTenant.roomId },
  })
  
  return apiSuccess(newTenant, 'Tenant created successfully')
})
