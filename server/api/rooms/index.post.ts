import { createRoom } from '../../services/room.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

defineRouteMeta({
  openAPI: {
    tags: ['Rooms'],
    summary: 'Create New Room',
    description: 'Adds a new room to a specific property, defining its base price, capacity, and identifying number/name.',
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

  if (!propertyId || !body.roomNumber || body.monthlyRate === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'propertyId, roomNumber, and monthlyRate are required' })
  }

  await requirePropertyPermission(event.context.user, propertyId)

  const newRoom = await createRoom(event.context.user, propertyId, {
    roomNumber: body.roomNumber,
    monthlyRate: body.monthlyRate,
    additionalFees: body.additionalFees,
  })
  
  await logActivity({
    userId: event.context.user.id,
    actorName: event.context.user.name,
    actorRole: event.context.user.role,
    action: 'ADD_ROOM',
    entityType: 'room',
    entityId: newRoom.id,
    details: { roomNumber: newRoom.roomNumber, propertyId },
  })
  
  return apiSuccess(newRoom, 'Room created successfully')
})
