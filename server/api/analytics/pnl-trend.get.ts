import { db } from '../../db'
import { payments, expenses } from '../../db/schema'
import { and, eq, inArray, sql, sum } from 'drizzle-orm'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

const MONTH_NAMES_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function getPastMonths(targetMonthStr: string, count: number = 6): Array<{ monthStr: string, label: string }> {
  const [yearStr, monthNumStr] = targetMonthStr.split('-')
  let year = parseInt(yearStr, 10)
  let month = parseInt(monthNumStr, 10) // 1-12

  const result: Array<{ monthStr: string, label: string }> = []

  for (let i = count - 1; i >= 0; i--) {
    let m = month - i
    let y = year
    while (m <= 0) {
      m += 12
      y -= 1
    }
    const monthStr = `${y}-${String(m).padStart(2, '0')}`
    const label = `${MONTH_NAMES_ID[m - 1]}`
    result.push({ monthStr, label })
  }

  return result
}

defineRouteMeta({
  openAPI: {
    tags: ['Analytics'],
    summary: 'Retrieve 6-Month P&L Historical Trend',
    description: 'Fetches historical financial time-series data (revenues, expenses, and net profit) over a 6-month trailing sliding window.',
    parameters: [
      {
        name: 'propertyId',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Target property ID to filter historical financial data.'
      },
      {
        name: 'month',
        in: 'query',
        required: false,
        schema: { type: 'string', example: '2026-08' },
        description: 'Anchor month in YYYY-MM format to calculate 6-month trailing window.'
      }
    ],
    responses: {
      200: {
        description: 'Array of 6 trailing months with financial breakdowns.'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const monthFilter = (query.month as string) || new Date().toISOString().slice(0, 7)
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

  const monthsList = getPastMonths(monthFilter, 6)

  if (targetPropertyIds.length === 0) {
    return apiSuccess(monthsList.map(m => ({
      month: m.monthStr,
      label: m.label,
      revenue: 0,
      expenses: 0,
      netProfit: 0
    })))
  }

  const monthStrings = monthsList.map(m => m.monthStr)

  // Query revenues and expenses per month in parallel
  const [revenueByMonthRes, expensesByMonthRes] = await Promise.all([
    db.select({
      month: payments.billingMonth,
      total: sum(payments.totalAmount)
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, 'paid'),
        inArray(payments.billingMonth, monthStrings),
        inArray(payments.propertyId, targetPropertyIds)
      )
    )
    .groupBy(payments.billingMonth),

    db.select({
      month: sql<string>`to_char(${expenses.date}, 'YYYY-MM')`.as('month'),
      total: sum(expenses.amount)
    })
    .from(expenses)
    .where(
      and(
        inArray(sql`to_char(${expenses.date}, 'YYYY-MM')`, monthStrings),
        inArray(expenses.propertyId, targetPropertyIds)
      )
    )
    .groupBy(sql`to_char(${expenses.date}, 'YYYY-MM')`)
  ])

  const revenueMap = new Map<string, number>()
  for (const r of revenueByMonthRes) {
    if (r.month) revenueMap.set(r.month, Number(r.total) || 0)
  }

  const expenseMap = new Map<string, number>()
  for (const e of expensesByMonthRes) {
    if (e.month) expenseMap.set(e.month, Number(e.total) || 0)
  }

  const trendData = monthsList.map(m => {
    const revenue = revenueMap.get(m.monthStr) || 0
    const expense = expenseMap.get(m.monthStr) || 0
    return {
      month: m.monthStr,
      label: m.label,
      revenue,
      expenses: expense,
      netProfit: revenue - expense
    }
  })

  return apiSuccess(trendData)
})
