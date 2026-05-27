import { db } from '../db'
import { expenses } from '../db/schema'
import { eq, inArray, desc } from 'drizzle-orm'
import { logActivity } from '../utils/audit'

export async function getExpensesByProperty(propertyIds: string[]) {
  if (propertyIds.length === 0) return []
  return await db.query.expenses.findMany({
    where: inArray(expenses.propertyId, propertyIds),
    orderBy: [desc(expenses.date), desc(expenses.createdAt)],
    with: {
      property: true
    }
  })
}

export async function createExpense(propertyId: string, payload: { category: string; amount: string | number; description?: string; date: string }, userId: string) {
  const [newExpense] = await db.insert(expenses).values({
    propertyId,
    category: payload.category,
    amount: String(payload.amount),
    description: payload.description || null,
    date: new Date(payload.date),
  }).returning()

  await logActivity({
    userId,
    action: 'CREATE',
    entityType: 'expense',
    entityId: newExpense.id,
    details: payload,
  })

  return newExpense
}
