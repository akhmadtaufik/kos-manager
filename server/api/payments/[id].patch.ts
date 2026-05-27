import { markPaymentAsPaid } from '../../services/payment.service'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { db } from '../../db'
import { payments } from '../../db/schema'
import { eq } from 'drizzle-orm'

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

  await requirePropertyAccess(event.context.user, payment.propertyId)

  const updated = await markPaymentAsPaid(id, event.context.user.id)
  
  return apiSuccess(updated, 'Payment marked as paid successfully')
})
