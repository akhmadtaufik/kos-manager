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
    description: 'Records an installment or settlement payment against an invoice. Dynamically updates amount paid and mutates invoice status to partial or paid with automatic rollover arrears distribution.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Invoice payment ID to record cash flow against.'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['amount'],
            properties: {
              amount: { type: 'number', example: 750000, description: 'Payment amount in IDR (must be > 0 and <= remaining total debt)' },
              notes: { type: 'string', example: 'Cicilan ke-1 via Transfer BCA', description: 'Optional memo or notes' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Transaction recorded and payment record updated.'
      },
      400: {
        description: 'Bad request - Overpayment or non-positive amount.'
      }
    }
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
