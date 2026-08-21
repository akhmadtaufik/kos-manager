import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
let mockBody: any = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(mockBody)))
let mockParam: Record<string, string> = {}
vi.stubGlobal('getRouterParam', vi.fn((event: any, param: string) => mockParam[param]))
vi.stubGlobal('createError', vi.fn((err: any) => {
  const error = new Error(err.statusMessage || err.message || 'Error') as any
  error.statusCode = err.statusCode || 500
  error.statusMessage = err.statusMessage
  error.data = err.data
  return error
}))

// Mock DB
let mockPaymentFindMany: any[] = []
let mockPaymentFindFirst: any = null
const mockTxnInsertReturning = vi.fn()
const mockPaymentUpdateReturning = vi.fn()

vi.mock('../../server/db', () => ({
  db: {
    query: {
      payments: {
        findFirst: vi.fn(() => Promise.resolve(mockPaymentFindFirst)),
        findMany: vi.fn(() => Promise.resolve(mockPaymentFindMany))
      }
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mockTxnInsertReturning
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: mockPaymentUpdateReturning
        }))
      }))
    }))
  }
}))

vi.mock('../../server/utils/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}))

vi.mock('../../server/utils/rbac', () => ({
  requirePropertyPermission: vi.fn().mockResolvedValue(true)
}))

vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ status: 'success', data, message }))
}))

import { recordPaymentTransaction } from '../../server/services/payment.service'

describe('Payments & Accounting Integrity API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockParam = {}
    mockPaymentFindFirst = null
    mockPaymentFindMany = []
  })

  describe('Negative Testing - Overpayment & Zero Amount Validation', () => {
    it('should reject payment transaction when amount is 0 or negative', async () => {
      await expect(
        recordPaymentTransaction('pay-1', 0, 'user-1')
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Nominal pembayaran harus lebih besar dari 0'
      })

      await expect(
        recordPaymentTransaction('pay-1', -50000, 'user-1')
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Nominal pembayaran harus lebih besar dari 0'
      })
    })

    it('should reject payment transaction when amount exceeds remaining balance', async () => {
      mockPaymentFindFirst = {
        id: 'pay-1',
        tenantId: 'tenant-1',
        billingMonth: '2026-08',
        totalAmount: '1500000',
        amountPaid: '500000',
        status: 'partial'
      }
      mockPaymentFindMany = [
        {
          id: 'pay-1',
          tenantId: 'tenant-1',
          billingMonth: '2026-08',
          totalAmount: '1500000',
          amountPaid: '500000',
          status: 'partial'
        }
      ]

      // Remaining debt is 1,000,000. Attempting to pay 1,500,000 must fail with 400.
      await expect(
        recordPaymentTransaction('pay-1', 1500000, 'user-1')
      ).rejects.toMatchObject({
        statusCode: 400
      })
    })
  })

  describe('State Transition Testing - Unpaid -> Partial -> Paid', () => {
    it('should transition status from unpaid to partial on partial payment', async () => {
      mockPaymentFindFirst = {
        id: 'pay-1',
        tenantId: 'tenant-1',
        billingMonth: '2026-08',
        totalAmount: '2000000',
        amountPaid: '0',
        status: 'unpaid'
      }
      mockPaymentFindMany = [
        {
          id: 'pay-1',
          tenantId: 'tenant-1',
          billingMonth: '2026-08',
          totalAmount: '2000000',
          amountPaid: '0',
          status: 'unpaid'
        }
      ]

      mockTxnInsertReturning.mockResolvedValue([{ id: 'txn-1', amount: '800000' }])
      mockPaymentUpdateReturning.mockResolvedValue([{
        id: 'pay-1',
        totalAmount: '2000000',
        amountPaid: '800000',
        status: 'partial'
      }])

      mockPaymentFindFirst = {
        id: 'pay-1',
        tenantId: 'tenant-1',
        billingMonth: '2026-08',
        totalAmount: '2000000',
        amountPaid: '800000',
        status: 'partial'
      }

      const result = await recordPaymentTransaction('pay-1', 800000, 'user-1', 'Cicilan ke-1')
      expect(result.transactions.length).toBe(1)
      expect(result.payment?.status).toBe('partial')
      expect(Number(result.payment?.amountPaid)).toBe(800000)
    })

    it('should transition status from partial to paid on complete settlement', async () => {
      mockPaymentFindFirst = {
        id: 'pay-1',
        tenantId: 'tenant-1',
        billingMonth: '2026-08',
        totalAmount: '2000000',
        amountPaid: '800000',
        status: 'partial'
      }
      mockPaymentFindMany = [
        {
          id: 'pay-1',
          tenantId: 'tenant-1',
          billingMonth: '2026-08',
          totalAmount: '2000000',
          amountPaid: '800000',
          status: 'partial'
        }
      ]

      mockTxnInsertReturning.mockResolvedValue([{ id: 'txn-2', amount: '1200000' }])
      mockPaymentUpdateReturning.mockResolvedValue([{
        id: 'pay-1',
        totalAmount: '2000000',
        amountPaid: '2000000',
        status: 'paid'
      }])

      mockPaymentFindFirst = {
        id: 'pay-1',
        tenantId: 'tenant-1',
        billingMonth: '2026-08',
        totalAmount: '2000000',
        amountPaid: '2000000',
        status: 'paid'
      }

      const result = await recordPaymentTransaction('pay-1', 1200000, 'user-1', 'Pelunasan')
      expect(result.transactions.length).toBe(1)
      expect(result.payment?.status).toBe('paid')
      expect(Number(result.payment?.amountPaid)).toBe(2000000)
    })
  })

  describe('Rollover Arrears Distribution across Months', () => {
    it('should allocate payment across oldest unpaid invoices first', async () => {
      mockPaymentFindFirst = {
        id: 'pay-aug',
        tenantId: 'tenant-1',
        billingMonth: '2026-08',
        totalAmount: '1000000',
        amountPaid: '0',
        status: 'unpaid'
      }
      // Two unpaid months: July (1,000,000) and August (1,000,000)
      mockPaymentFindMany = [
        {
          id: 'pay-jul',
          tenantId: 'tenant-1',
          billingMonth: '2026-07',
          totalAmount: '1000000',
          amountPaid: '0',
          status: 'unpaid'
        },
        {
          id: 'pay-aug',
          tenantId: 'tenant-1',
          billingMonth: '2026-08',
          totalAmount: '1000000',
          amountPaid: '0',
          status: 'unpaid'
        }
      ]

      mockTxnInsertReturning.mockResolvedValue([{ id: 'txn-1' }])
      mockPaymentUpdateReturning.mockResolvedValue([{ id: 'pay-jul' }])

      // Paying 1,500,000 -> July is fully paid (1,000,000), August receives remaining 500,000
      const result = await recordPaymentTransaction('pay-aug', 1500000, 'user-1')
      expect(result.transactions.length).toBe(2)
      expect(result.payment).toBeDefined()
    })
  })
})
