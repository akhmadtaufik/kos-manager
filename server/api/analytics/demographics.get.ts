import { db } from '../../db'
import { tenants, rooms } from '../../db/schema'
import { and, eq, inArray, sql, count } from 'drizzle-orm'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Analytics'],
    summary: 'Retrieve Tenant Demographics',
    description: 'Fetches analytical data regarding tenant demographics, such as age distribution, gender, and occupation, to help owners understand their market.',
    responses: {
        "200": {
            "description": "Successful retrieval of data",
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
                                "example": "Data retrieved successfully"
                            },
                            "data": {
                                "type": "object"
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
  const query = getQuery(event)
  const propertyId = String(query.propertyId)
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined' && propertyId !== '') {
    await requirePropertyPermission(user, propertyId, 'view_reports')
    targetPropertyIds = [propertyId]
  } else {
    // Global view
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  if (targetPropertyIds.length === 0) {
    return apiSuccess([])
  }

  // Get active tenants joined with rooms to filter by target properties
  const results = await db.select({
      provinceId: tenants.provinceId,
      total: count()
    })
    .from(tenants)
    .innerJoin(rooms, eq(tenants.roomId, rooms.id))
    .where(
      and(
        eq(tenants.isActive, 1),
        inArray(rooms.propertyId, targetPropertyIds)
      )
    )
    .groupBy(tenants.provinceId)

  // Map null province IDs to "Tidak Diketahui" or something similar if any
  const mapped = results.map(row => ({
    provinceId: row.provinceId || 'unknown',
    total: Number(row.total)
  })).sort((a, b) => b.total - a.total)

  return apiSuccess(mapped)
})
