import { db } from '../../db'
import { rooms, payments, expenses } from '../../db/schema'
import { and, eq, inArray, sql, sum, count } from 'drizzle-orm'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess, HttpError } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Reports'],
    summary: 'Get Recapitulation Report',
    description: 'Fetches a high-level summary report containing key metrics like total income, total expenses, and occupancy rates over a specified period.',
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
  const monthFilter = (query.month as string) || new Date().toISOString().slice(0, 7) // Default "YYYY-MM"
  
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined') {
    await requirePropertyPermission(user, propertyId, 'view_reports')
    targetPropertyIds = [propertyId]
  } else {
    // Global view
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  if (targetPropertyIds.length === 0) {
    return apiSuccess({
      totalRooms: 0,
      occupiedRooms: 0,
      revenue: 0,
      expenses: 0,
      netProfit: 0,
      month: monthFilter
    })
  }

  // Execute queries concurrently for maximum performance
  const [roomsTotalRes, roomsOccupiedRes, revenueRes, expensesRes] = await Promise.all([
    // 1. Total Rooms
    db.select({ value: count() })
      .from(rooms)
      .where(inArray(rooms.propertyId, targetPropertyIds)),
      
    // 2. Occupied Rooms
    db.select({ value: count() })
      .from(rooms)
      .where(
        and(
          eq(rooms.status, 'occupied'),
          inArray(rooms.propertyId, targetPropertyIds)
        )
      ),

    // 3. Revenue (Payments paid in the specific billingMonth)
    db.select({ value: sum(payments.totalAmount) })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'paid'),
          eq(payments.billingMonth, monthFilter),
          inArray(payments.propertyId, targetPropertyIds)
        )
      ),

    // 4. Expenses (Expenses in the specific month)
    db.select({ value: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          sql`to_char(${expenses.date}, 'YYYY-MM') = ${monthFilter}`,
          inArray(expenses.propertyId, targetPropertyIds)
        )
      )
  ])

  const totalRooms = Number(roomsTotalRes[0]?.value || 0)
  const occupiedRooms = Number(roomsOccupiedRes[0]?.value || 0)
  const revenue = Number(revenueRes[0]?.value || 0)
  const totalExpenses = Number(expensesRes[0]?.value || 0)
  const netProfit = revenue - totalExpenses

  return apiSuccess({
    totalRooms,
    occupiedRooms,
    revenue,
    expenses: totalExpenses,
    netProfit,
    month: monthFilter
  })
})
