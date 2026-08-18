import { db } from '../db'
import { expenses } from '../db/schema'
import { eq, inArray, desc, and, sql } from 'drizzle-orm'
import { logActivity } from '../utils/audit'

export async function getExpensesByProperty(
  propertyIds: string[],
  filters?: { month?: string | number; year?: string | number }
) {
  if (propertyIds.length === 0) return []

  const conditions = [inArray(expenses.propertyId, propertyIds)]

  if (filters?.year && filters?.month) {
    const formattedMonth = String(filters.month).padStart(2, '0')
    const monthYear = `${filters.year}-${formattedMonth}`
    conditions.push(sql`to_char(${expenses.date}, 'YYYY-MM') = ${monthYear}`)
  } else if (filters?.year) {
    conditions.push(sql`to_char(${expenses.date}, 'YYYY') = ${String(filters.year)}`)
  } else if (filters?.month) {
    if (String(filters.month).includes('-')) {
      conditions.push(sql`to_char(${expenses.date}, 'YYYY-MM') = ${String(filters.month)}`)
    } else {
      conditions.push(sql`EXTRACT(MONTH FROM ${expenses.date}) = ${Number(filters.month)}`)
    }
  }

  return await db.query.expenses.findMany({
    where: conditions.length === 1 ? conditions[0] : and(...conditions),
    orderBy: [desc(expenses.date), desc(expenses.createdAt)],
    with: {
      property: true
    }
  })
}

export async function createExpense(
  propertyId: string,
  payload: { category: string; amount: string | number; description?: string | null; date: string },
  userId: string
) {
  const [newExpense] = await db.insert(expenses).values({
    propertyId,
    category: payload.category,
    amount: String(payload.amount),
    description: payload.description || null,
    date: new Date(payload.date),
  }).returning() as any[]

  await logActivity({
    userId,
    action: 'CREATE',
    entityType: 'expense',
    entityId: newExpense.id,
    details: payload,
  })

  return newExpense!
}

export async function updateExpense(
  id: string,
  payload: { category?: string; amount?: string | number; description?: string | null; date?: string },
  userId: string
) {
  const expense = await db.query.expenses.findFirst({
    where: eq(expenses.id, id)
  })

  if (!expense) {
    throw createError({ statusCode: 404, statusMessage: 'Expense not found' })
  }

  const updateData: Record<string, any> = {
    updatedAt: new Date()
  }

  if (payload.category !== undefined) updateData.category = payload.category
  if (payload.amount !== undefined) updateData.amount = String(payload.amount)
  if (payload.description !== undefined) updateData.description = payload.description || null
  if (payload.date !== undefined) updateData.date = new Date(payload.date)

  const [updated] = await db.update(expenses)
    .set(updateData)
    .where(eq(expenses.id, id))
    .returning() as any[]

  await logActivity({
    userId,
    action: 'UPDATE',
    entityType: 'expense',
    entityId: id,
    before: expense,
    after: updated,
    details: { propertyId: expense.propertyId, ...payload }
  })

  return updated
}

