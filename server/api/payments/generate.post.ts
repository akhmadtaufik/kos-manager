import { generateMonthlyInvoices } from '../../services/payment.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { propertyId, billingMonth } = body

  if (!propertyId || !billingMonth) {
    throw createError({ statusCode: 400, statusMessage: 'propertyId and billingMonth are required' })
  }

  await requirePropertyPermission(event.context.user, propertyId, 'manage_payments')

  const result = await generateMonthlyInvoices(propertyId, billingMonth, event.context.user.id)
  
  return apiSuccess(result, `${result.generatedCount} invoices generated successfully`)
})
