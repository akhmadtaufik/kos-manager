import { db } from '../../db'
import { payments, paymentTransactions } from '../../db/schema'
import { eq, desc, and, lt, ne, sql } from 'drizzle-orm'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'Get Detailed Invoice with Transactions',
    description: 'Retrieves complete invoice breakdown including base room rent, itemized additional fees, tenant details, payment timestamp, transaction history ledger, and rolled-over arrears.'
  }
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = event.context.user

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Payment ID is required' })
  }

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, id),
    with: {
      property: true,
      tenant: {
        with: {
          room: true
        }
      },
      transactions: {
        with: {
          recorder: true
        },
        orderBy: [desc(paymentTransactions.paymentDate), desc(paymentTransactions.createdAt)]
      }
    }
  })

  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: 'Payment invoice not found' })
  }

  // Verify property access
  await requirePropertyAccess(user, payment.propertyId)

  // Calculate Rollover Arrears (Tunggakan)
  const previousArrearsResult = await db
    .select({
      totalArrears: sql<number>`SUM(CAST(${payments.totalAmount} AS NUMERIC) - CAST(${payments.amountPaid} AS NUMERIC))`.mapWith(Number)
    })
    .from(payments)
    .where(
      and(
        eq(payments.tenantId, payment.tenantId),
        lt(payments.billingMonth, payment.billingMonth),
        ne(payments.status, 'paid')
      )
    )

  const previousArrears = previousArrearsResult[0]?.totalArrears || 0
  const grandTotal = Number(payment.totalAmount) + previousArrears

  return apiSuccess({
    ...payment,
    previousArrears,
    grandTotal
  }, 'Payment details retrieved successfully')
})
