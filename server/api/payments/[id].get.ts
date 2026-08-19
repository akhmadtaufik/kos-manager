import { db } from '../../db'
import { payments } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'Get Detailed Invoice',
    description: 'Retrieves complete invoice breakdown including base room rent, itemized additional fees, tenant details, and payment timestamp.'
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
      }
    }
  })

  if (!payment) {
    throw createError({ statusCode: 404, statusMessage: 'Payment invoice not found' })
  }

  // Verify property access
  await requirePropertyAccess(user, payment.propertyId)

  return apiSuccess(payment, 'Payment details retrieved successfully')
})
