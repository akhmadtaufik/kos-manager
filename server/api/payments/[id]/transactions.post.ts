import { db } from '../../../db'
import { payments } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyPermission } from '../../../utils/rbac'
import { apiSuccess } from '../../../utils/response'
import { recordPaymentTransaction } from '../../../services/payment.service'
import { z } from 'zod'

const createPaymentTransactionSchema = z.object({
  amount: z.coerce.number().positive('Nominal pembayaran harus lebih besar dari 0'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
})

defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'Record Payment Transaction (Partial / Installment)',
    description: 'Records a partial or full payment cash flow against an invoice. Dynamically updates amount paid and mutates invoice status to partial or paid.'
  }
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = event.context.user

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Payment ID is required' })
  }

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, id)
  })

  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: 'Tagihan pembayaran tidak ditemukan' })
  }

  // Enforce granular permission: payments:update
  await requirePropertyPermission(user, payment.propertyId, 'payments:update')

  const body = await readBody(event)
  const validation = createPaymentTransactionSchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validation.error.errors[0]?.message || 'Input pembayaran tidak valid'
    })
  }

  const { amount, notes } = validation.data
  const result = await recordPaymentTransaction(id, amount, user.id, notes)

  return apiSuccess(result, 'Pembayaran berhasil dicatat')
})
