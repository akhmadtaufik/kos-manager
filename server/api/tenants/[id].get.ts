import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../../db'
import { tenants, rooms, payments, paymentTransactions } from '../../db/schema'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { resolveKemendagriLocation } from '../../utils/kemendagri'

defineRouteMeta({
  openAPI: {
    tags: ['Tenants'],
    summary: 'Get Tenant 360 Profile & Financial Summary',
    description: 'Retrieves complete demographic profile, room assignment, Kemendagri geographical location, and financial ledger arrears for a specific tenant.',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Target tenant ID.'
      }
    ],
    responses: {
      200: {
        description: 'Tenant 360 profile retrieved successfully.'
      },
      404: {
        description: 'Tenant not found.'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Tenant ID is required' })
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, id),
    with: {
      room: {
        with: {
          property: true
        }
      }
    }
  })

  if (!tenant) {
    throw createError({ statusCode: 404, statusMessage: 'Tenant not found' })
  }

  await requirePropertyAccess(event.context.user, tenant.room.propertyId)

  // Fetch all payment records for this tenant to compute financial standing
  const tenantPayments = await db.query.payments.findMany({
    where: eq(payments.tenantId, id),
    orderBy: [desc(payments.billingMonth)],
    with: {
      transactions: {
        orderBy: [desc(paymentTransactions.paymentDate)],
        with: {
          recorder: {
            columns: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  })

  // Calculate total arrears (sisa tagihan yang belum lunas)
  let totalArrears = 0
  let unpaidCount = 0

  for (const inv of tenantPayments) {
    if (inv.status !== 'paid') {
      const remaining = Number(inv.totalAmount) - Number(inv.amountPaid)
      if (remaining > 0) {
        totalArrears += remaining
        unpaidCount++
      }
    }
  }

  // Resolve Kemendagri geographical information
  const location = resolveKemendagriLocation(tenant.provinceId, tenant.regencyId, tenant.districtId)

  const tenant360 = {
    ...tenant,
    location,
    financial: {
      totalArrears,
      unpaidInvoicesCount: unpaidCount,
      totalInvoicesCount: tenantPayments.length,
      recentPayments: tenantPayments
    }
  }

  return apiSuccess(tenant360, 'Tenant 360 profile retrieved successfully')
})
