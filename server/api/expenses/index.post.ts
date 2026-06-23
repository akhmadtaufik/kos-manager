import { createExpense } from '../../services/expense.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectExpenseSchema, insertExpenseSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Expenses'],
    summary: 'Create Expense Record',
    description: 'Logs a new operational expense, including amount, category, date, and associated property.',
    responses: {
      201: {
        description: 'Resource successfully created',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: selectExpenseSchema })) } }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
})
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
