import { getPaymentsByProperty } from '../../services/payment.service'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'List All Payments',
    description: 'Retrieves a list of all payment transactions, allowing filtering by status, date, and tenant.',
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
  const propertyId = query.propertyId as string
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined') {
    await requirePropertyPermission(user, propertyId)
    targetPropertyIds = [propertyId]
  } else {
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  const payments = await getPaymentsByProperty(targetPropertyIds)
  
  return apiSuccess(payments, 'Payments retrieved successfully')
})
