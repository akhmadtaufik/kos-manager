import { db } from '../../db'
import { expenses } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectExpenseSchema, insertExpenseSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Expenses'],
    summary: 'Delete Expense Record',
    description: 'Permanently removes a specific expense record identified by its ID.',
    responses: {
      200: {
        description: 'Resource successfully deleted',
        content: { 'application/json': { schema:  { $ref: '#/components/responses/SuccessResponse/content/application/json/schema' }  } }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
})
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Expense ID is required' })
  }

  // Find expense to verify property access
  const expense = await db.query.expenses.findFirst({
    where: eq(expenses.id, id)
  })

  if (!expense) {
    throw createError({ statusCode: 404, statusMessage: 'Expense not found' })
  }

  await requirePropertyPermission(event.context.user, expense.propertyId, 'manage_expenses')

  // Delete expense
  await db.delete(expenses).where(eq(expenses.id, id))

  await logActivity({
    userId: event.context.user.id,
    action: 'DELETE',
    entityType: 'expense',
    entityId: id,
    details: { propertyId: expense.propertyId, category: expense.category }
  })

  return apiSuccess(null, 'Pengeluaran berhasil dihapus')
})
