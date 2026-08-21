import { db } from '../../db'
import { rooms, payments, expenses } from '../../db/schema'
import { and, eq, inArray, sql, sum, count } from 'drizzle-orm'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess, HttpError } from '../../utils/response'


function getPreviousMonth(monthStr: string): string {
  const parts = monthStr.split('-')
  const yearStr = parts[0] || '1970'
  const monthNumStr = parts[1] || '1'
  let year = parseInt(yearStr, 10)
  let month = parseInt(monthNumStr, 10) - 1
  if (month < 1) {
    month = 12
    year -= 1
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

function calculateMoMPercent(current: number, previous: number): number {
  if (previous === 0) {
    if (current === 0) return 0
    if (current > 0) return 100
    return -100
  }
  const delta = ((current - previous) / Math.abs(previous)) * 100
  return Math.round(delta * 10) / 10
}

defineRouteMeta({
  openAPI: {
    tags: ['Reports'],
    summary: 'Get Recapitulation Report with MoM Analytics',
    description: 'Fetches high-level summary KPIs (total income, expenses, occupancy rate, net profit) with real Month-over-Month (MoM) deltas and calendar rollover support.',
    parameters: [
      {
        name: 'propertyId',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Target property ID to filter report data. If omitted, aggregates across all accessible properties.'
      },
      {
        name: 'month',
        in: 'query',
        required: false,
        schema: { type: 'string', example: '2026-08' },
        description: 'Target billing month in YYYY-MM format. Defaults to current month.'
      }
    ],
    responses: {
      200: {
        description: 'Recapitulation report and Month-over-Month calculations retrieved successfully.'
      }
    }
  }
})
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const monthFilter = (query.month as string) || new Date().toISOString().slice(0, 7) // Default "YYYY-MM"
  const prevMonthFilter = getPreviousMonth(monthFilter)
  
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined' && propertyId !== '') {
    await requirePropertyPermission(user, propertyId, 'reports:read')
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
      month: monthFilter,
      previousMonth: prevMonthFilter,
      previous: {
        totalRooms: 0,
        occupiedRooms: 0,
        revenue: 0,
        expenses: 0,
        netProfit: 0
      },
      mom: {
        totalRoomsDelta: 0,
        occupiedRoomsDelta: 0,
        occupancyRateMoM: 0,
        revenueMoM: 0,
        expensesMoM: 0,
        netProfitMoM: 0
      }
    })
  }

  // Execute current and previous month queries concurrently for maximum performance
  const [
    roomsTotalRes,
    roomsOccupiedRes,
    prevOccupiedRes,
    revenueRes,
    prevRevenueRes,
    expensesRes,
    prevExpensesRes
  ] = await Promise.all([
    // 1. Total Rooms
    db.select({ value: count() })
      .from(rooms)
      .where(inArray(rooms.propertyId, targetPropertyIds)),
      
    // 2. Current Occupied Rooms
    db.select({ value: count() })
      .from(rooms)
      .where(
        and(
          eq(rooms.status, 'occupied'),
          inArray(rooms.propertyId, targetPropertyIds)
        )
      ),

    // 3. Previous Month Occupied Rooms (distinct tenants with payments generated for prev month)
    db.select({ value: count(sql`distinct ${payments.tenantId}`) })
      .from(payments)
      .where(
        and(
          eq(payments.billingMonth, prevMonthFilter),
          inArray(payments.propertyId, targetPropertyIds)
        )
      ),

    // 4. Current Month Revenue (paid payments in the billingMonth)
    db.select({ value: sum(payments.totalAmount) })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'paid'),
          eq(payments.billingMonth, monthFilter),
          inArray(payments.propertyId, targetPropertyIds)
        )
      ),

    // 5. Previous Month Revenue
    db.select({ value: sum(payments.totalAmount) })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'paid'),
          eq(payments.billingMonth, prevMonthFilter),
          inArray(payments.propertyId, targetPropertyIds)
        )
      ),

    // 6. Current Month Expenses
    db.select({ value: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          sql`to_char(${expenses.date}, 'YYYY-MM') = ${monthFilter}`,
          inArray(expenses.propertyId, targetPropertyIds)
        )
      ),

    // 7. Previous Month Expenses
    db.select({ value: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          sql`to_char(${expenses.date}, 'YYYY-MM') = ${prevMonthFilter}`,
          inArray(expenses.propertyId, targetPropertyIds)
        )
      )
  ])

  const totalRooms = Number(roomsTotalRes[0]?.value || 0)
  const occupiedRooms = Number(roomsOccupiedRes[0]?.value || 0)
  const prevOccupiedRooms = Number(prevOccupiedRes[0]?.value || 0)

  const revenue = Number(revenueRes[0]?.value || 0)
  const prevRevenue = Number(prevRevenueRes[0]?.value || 0)

  const totalExpenses = Number(expensesRes[0]?.value || 0)
  const prevTotalExpenses = Number(prevExpensesRes[0]?.value || 0)

  const netProfit = revenue - totalExpenses
  const prevNetProfit = prevRevenue - prevTotalExpenses

  const currentOccupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0
  const prevOccupancyRate = totalRooms > 0 ? (prevOccupiedRooms / totalRooms) * 100 : 0
  const occupancyRateMoM = Math.round((currentOccupancyRate - prevOccupancyRate) * 10) / 10

  const revenueMoM = calculateMoMPercent(revenue, prevRevenue)
  const expensesMoM = calculateMoMPercent(totalExpenses, prevTotalExpenses)
  const netProfitMoM = calculateMoMPercent(netProfit, prevNetProfit)
  const occupiedRoomsDelta = occupiedRooms - prevOccupiedRooms

  return apiSuccess({
    totalRooms,
    occupiedRooms,
    revenue,
    expenses: totalExpenses,
    netProfit,
    month: monthFilter,
    previousMonth: prevMonthFilter,
    previous: {
      totalRooms,
      occupiedRooms: prevOccupiedRooms,
      revenue: prevRevenue,
      expenses: prevTotalExpenses,
      netProfit: prevNetProfit
    },
    mom: {
      totalRoomsDelta: 0,
      occupiedRoomsDelta,
      occupancyRateMoM,
      revenueMoM,
      expensesMoM,
      netProfitMoM
    }
  })
})
