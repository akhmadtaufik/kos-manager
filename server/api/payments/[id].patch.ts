import { markPaymentAsPaid } from '../../services/payment.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { db } from '../../db'
import { payments } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectPaymentSchema, insertPaymentSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'Update Payment Status',
    description: 'Updates the details or status (e.g., pending, paid, overdue) of a specific payment transaction.',
    responses: {
      200: {
        description: 'Resource successfully updated',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: selectPaymentSchema })) } }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' },
      500: { $ref: '#/components/responses/InternalServerError' }
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
