import { createExpense } from '../../services/expense.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { propertyId, category, amount, description, date } = body

  if (!propertyId || !category || !amount || !date) {
    throw createError({ statusCode: 400, statusMessage: 'propertyId, category, amount, and date are required' })
  }

  await requirePropertyPermission(event.context.user, propertyId, 'manage_expenses')

  const newExpense = await createExpense(propertyId, { category, amount, description, date }, event.context.user.id)
  
  return apiSuccess(newExpense, 'Expense recorded successfully')
})
