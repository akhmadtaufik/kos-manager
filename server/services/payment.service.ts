import { db } from '../db'
import { payments, tenants, rooms } from '../db/schema'
import { and, eq, inArray, desc } from 'drizzle-orm'
import { logActivity } from '../utils/audit'

export async function getPaymentsByProperty(propertyIds: string[]) {
  if (propertyIds.length === 0) return []
  return await db.query.payments.findMany({
    where: inArray(payments.propertyId, propertyIds),
    with: {
      property: true,
      tenant: {
        with: {
          room: true
        }
      }
    },
    orderBy: [desc(payments.billingMonth), desc(payments.createdAt)],
  })
}

export async function generateMonthlyInvoices(propertyId: string, billingMonth: string, userId: string) {
  // Find all active tenants
  const activeTenants = await db.query.tenants.findMany({
    where: eq(tenants.isActive, 1),
    with: {
      room: true
    }
  })

  // Filter tenants by propertyId
  const propertyTenants = activeTenants.filter(t => t.room && t.room.propertyId === propertyId)

  let generatedCount = 0

  for (const tenant of propertyTenants) {
    // Check if payment already exists
    const existing = await db.query.payments.findFirst({
      where: and(
        eq(payments.tenantId, tenant.id),
        eq(payments.billingMonth, billingMonth)
      )
    })

    if (!existing) {
      const baseRent = tenant.room.monthlyRate
      await db.insert(payments).values({
        tenantId: tenant.id,
        propertyId,
        billingMonth,
        baseRent,
        totalAmount: baseRent, // Initially same as baseRent (no additional fees yet)
        status: 'unpaid',
      })
      generatedCount++
    }
  }

  if (generatedCount > 0) {
    await logActivity({
      userId,
      action: 'BULK_GENERATE',
      entityType: 'payment',
      details: { propertyId, billingMonth, count: generatedCount },
    })
  }

  return { generatedCount }
}

export async function markPaymentAsPaid(paymentId: string, userId: string) {
  const [updated] = await db.update(payments)
    .set({ 
      status: 'paid', 
      paidAt: new Date() 
    })
    .where(eq(payments.id, paymentId))
    .returning()

  if (updated) {
    await logActivity({
      userId,
      action: 'UPDATE_STATUS',
      entityType: 'payment',
      entityId: paymentId,
      details: { status: 'paid' },
    })
  }

  return updated
}
