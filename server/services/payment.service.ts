import { db } from '../db'
import { payments, tenants, rooms, paymentTransactions } from '../db/schema'
import { and, eq, inArray, desc, lte, asc, ne } from 'drizzle-orm'
import { logActivity } from '../utils/audit'

export async function getPaymentsByProperty(propertyIds: string[], billingMonth?: string) {
  if (propertyIds.length === 0) return []
  const conditions = [inArray(payments.propertyId, propertyIds)]
  if (billingMonth) {
    conditions.push(eq(payments.billingMonth, billingMonth))
  }
  return await db.query.payments.findMany({
    where: and(...conditions),
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
      const roomFees = Array.isArray(tenant.room.additionalFees) ? tenant.room.additionalFees : []
      const feesTotal = roomFees.reduce((sum: number, fee: any) => sum + (Number(fee.amount) || 0), 0)
      const totalAmount = String(Number(baseRent) + feesTotal)

      await db.insert(payments).values({
        tenantId: tenant.id,
        propertyId,
        billingMonth,
        baseRent,
        additionalFees: roomFees,
        totalAmount: totalAmount,
        amountPaid: '0',
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

export async function recordPaymentTransaction(
  paymentId: string,
  amount: number,
  userId: string,
  notes?: string
) {
  if (amount <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nominal pembayaran harus lebih besar dari 0' })
  }

  const targetPayment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId)
  })

  if (!targetPayment) {
    throw createError({ statusCode: 404, statusMessage: 'Tagihan pembayaran tidak ditemukan' })
  }

  // Fetch all unpaid invoices for this tenant up to the target billing month, ordered by oldest first
  const unpaidInvoices = await db.query.payments.findMany({
    where: and(
      eq(payments.tenantId, targetPayment.tenantId),
      lte(payments.billingMonth, targetPayment.billingMonth),
      ne(payments.status, 'paid')
    ),
    orderBy: [asc(payments.billingMonth)]
  })

  const totalRemainingDebt = unpaidInvoices.reduce((sum, inv) => {
    return sum + (Number(inv.totalAmount) - Number(inv.amountPaid))
  }, 0)

  if (amount > totalRemainingDebt) {
    throw createError({
      statusCode: 400,
      statusMessage: `Nominal pembayaran (Rp ${amount.toLocaleString('id-ID')}) melebihi total tagihan tertunggak (Rp ${totalRemainingDebt.toLocaleString('id-ID')})`
    })
  }

  let remainingAmountToDistribute = amount;
  const transactions = [];

  for (const inv of unpaidInvoices) {
    if (remainingAmountToDistribute <= 0) break;

    const currentPaid = Number(inv.amountPaid) || 0;
    const totalAmount = Number(inv.totalAmount) || 0;
    const remainingForInv = totalAmount - currentPaid;

    if (remainingForInv <= 0) continue;

    const amountToApply = Math.min(remainingAmountToDistribute, remainingForInv);
    const newAmountPaid = currentPaid + amountToApply;
    const newStatus = newAmountPaid >= totalAmount ? 'paid' : 'partial';
    const isFullyPaid = newStatus === 'paid';

    // Insert transaction
    const [txn] = await db.insert(paymentTransactions).values({
      paymentId: inv.id,
      amount: String(amountToApply),
      paymentDate: new Date(),
      recordedBy: userId,
      notes: notes || (inv.id !== paymentId ? 'Distribusi Pembayaran Tunggakan (Rollover Arrears)' : null),
    }).returning();

    transactions.push(txn);

    // Update payment record
    const [updated] = await db.update(payments).set({
      amountPaid: String(newAmountPaid),
      status: newStatus,
      paidAt: isFullyPaid ? new Date() : inv.paidAt,
      updatedAt: new Date()
    }).where(eq(payments.id, inv.id)).returning();

    await logActivity({
      userId,
      action: 'RECORD_TRANSACTION',
      entityType: 'payment_transaction',
      entityId: txn?.id,
      details: {
        paymentId: inv.id,
        amount: amountToApply,
        newAmountPaid,
        remaining: totalAmount - newAmountPaid,
        status: newStatus,
        isRollover: inv.id !== paymentId
      }
    });

    remainingAmountToDistribute -= amountToApply;
  }

  // Refetch the target payment to return updated state
  const updatedTargetPayment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId)
  });

  return {
    transactions,
    payment: updatedTargetPayment
  }
}

export async function markPaymentAsPaid(paymentId: string, userId: string) {
  const before = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId)
  })

  if (!before) {
    throw createError({ statusCode: 404, statusMessage: 'Tagihan pembayaran tidak ditemukan' })
  }

  const currentPaid = Number(before.amountPaid) || 0
  const totalAmount = Number(before.totalAmount) || 0
  const remaining = totalAmount - currentPaid

  if (remaining > 0) {
    // Record settlement transaction for the remaining balance
    await db.insert(paymentTransactions).values({
      paymentId,
      amount: String(remaining),
      paymentDate: new Date(),
      recordedBy: userId,
      notes: 'Pelunasan Penuh (Full Settlement)',
    })
  }

  const [updated] = await db.update(payments)
    .set({ 
      amountPaid: before.totalAmount,
      status: 'paid', 
      paidAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(payments.id, paymentId))
    .returning()

  if (updated) {
    await logActivity({
      userId,
      action: 'UPDATE_STATUS',
      entityType: 'payment',
      entityId: paymentId,
      before,
      after: updated
    })
  }

  return updated
}
