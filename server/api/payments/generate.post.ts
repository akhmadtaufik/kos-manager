import { generateMonthlyInvoices } from '../../services/payment.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'Generate Payment Invoices',
    description: 'Automatically generates new payment invoices for active tenants based on their billing cycles and room rates.',
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
  const { propertyId, billingMonth } = body

  if (!propertyId || !billingMonth) {
    throw createError({ statusCode: 400, statusMessage: 'propertyId and billingMonth are required' })
  }

  await requirePropertyPermission(event.context.user, propertyId, 'manage_payments')

  const result = await generateMonthlyInvoices(propertyId, billingMonth, event.context.user.id)
  
  return apiSuccess(result, `${result.generatedCount} invoices generated successfully`)
})
