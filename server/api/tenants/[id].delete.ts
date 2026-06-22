import { db } from '../../db'
import { tenants, rooms } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'

defineRouteMeta({
  openAPI: {
    tags: ['Tenants'],
    summary: 'Remove Tenant',
    description: 'Removes a tenant from the system. Usually performed when a tenant permanently moves out and their contract is fully settled.',
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

  try {
    const [deleted] = await db.delete(tenants).where(eq(tenants.id, id)).returning()

    if (deleted) {
      await logActivity({
        userId: event.context.user.id,
        action: 'DELETE',
        entityType: 'tenant',
        entityId: id,
        details: { name: deleted.name }
      })
    }

    return apiSuccess(deleted, 'Tenant record deleted successfully')
  } catch (error: any) {
    if (error.code === '23503') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tolak Hapus: Penghuni ini masih memiliki riwayat Tagihan. Harap hapus tagihannya terlebih dahulu.'
      })
    }
    throw error
  }
})
