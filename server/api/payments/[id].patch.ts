import { markPaymentAsPaid } from '../../services/payment.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { db } from '../../db'
import { payments } from '../../db/schema'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'Update Payment Status',
    description: 'Updates the details or status (e.g., pending, paid, overdue) of a specific payment transaction.',
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
    throw createError({ statusCode: 400, statusMessage: 'Payment ID is required' })
  }

  // Fetch payment to check property access
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, id)
  })

  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: 'Payment not found' })
  }

  await requirePropertyPermission(event.context.user, payment.propertyId, 'manage_payments')

  const updated = await markPaymentAsPaid(id, event.context.user.id)
  
  return apiSuccess(updated, 'Payment marked as paid successfully')
})
