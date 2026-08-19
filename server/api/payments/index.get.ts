import { getPaymentsByProperty } from '../../services/payment.service'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { z } from 'zod'

const paymentSummarySchema = z.object({
  totalBilled: z.number(),
  totalPaid: z.number(),
  totalOutstanding: z.number(),
  countTotal: z.number(),
  countPaid: z.number(),
  countPartial: z.number(),
  countUnpaid: z.number()
})

defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'List All Payments with Financial Summary',
    description: 'Retrieves a list of all payment transactions alongside aggregated monthly financial metrics (total billed, paid, and outstanding amounts).'
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const billingMonth = query.billingMonth as string | undefined
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined' && propertyId !== '') {
    await requirePropertyAccess(user, propertyId)
    targetPropertyIds = [propertyId]
  } else {
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  const records = await getPaymentsByProperty(targetPropertyIds, billingMonth)

  // Calculate real-time summary metrics
  let totalBilled = 0
  let totalPaid = 0
  let totalOutstanding = 0
  let countPaid = 0
  let countPartial = 0
  let countUnpaid = 0

  for (const record of records) {
    const total = Number(record.totalAmount) || 0
    const paid = Number(record.amountPaid) || 0
    const remaining = Math.max(0, total - paid)

    totalBilled += total
    totalPaid += paid
    totalOutstanding += remaining

    if (record.status === 'paid') {
      countPaid++
    } else if (record.status === 'partial') {
      countPartial++
    } else {
      countUnpaid++
    }
  }

  const summary = paymentSummarySchema.parse({
    totalBilled,
    totalPaid,
    totalOutstanding,
    countTotal: records.length,
    countPaid,
    countPartial,
    countUnpaid
  })
  
  return apiSuccess({
    items: records,
    summary
  }, 'Payments retrieved successfully')
})
