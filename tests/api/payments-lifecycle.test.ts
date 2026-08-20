import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
let mockBody: any = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(mockBody)))
let mockQuery: any = {}
vi.stubGlobal('getQuery', vi.fn(() => mockQuery))
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
let mockPaymentsFindMany: any[] = []
let mockTenantsFindMany: any[] = []
let mockPaymentsFindFirst: any = null
const mockInsertValues = vi.fn().mockResolvedValue(true)
const mockUpdateSet = vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{}]) })) }))

vi.mock('../../server/db', () => ({
  db: {
    query: {
      payments: {
        findFirst: vi.fn(() => Promise.resolve(mockPaymentsFindFirst)),
        findMany: vi.fn(() => Promise.resolve(mockPaymentsFindMany))
      },
      tenants: {
        findMany: vi.fn(() => Promise.resolve(mockTenantsFindMany))
      }
    },
    insert: vi.fn(() => ({ values: mockInsertValues })),
    update: vi.fn(() => ({ set: mockUpdateSet }))
  }
}))

vi.mock('../../server/services/property.service', () => ({
  getUserProperties: vi.fn().mockResolvedValue([{ id: 'prop-1', name: 'Kos Melati' }])
}))

vi.mock('../../server/utils/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}))

vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ status: 'success', data, message }))
}))

vi.mock('../../server/utils/rbac', () => ({
  requirePropertyAccess: vi.fn().mockResolvedValue(true),
  requirePropertyPermission: vi.fn().mockResolvedValue(true)
}))

import { generateMonthlyInvoices } from '../../server/services/payment.service'

describe('Payments Lifecycle & Bulk Billing API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockQuery = {}
    mockParam = {}
    mockPaymentsFindMany = []
    mockTenantsFindMany = []
    mockPaymentsFindFirst = null
  })

  describe('POST /api/payments/generate - Bulk Monthly Billing Calculation', () => {
    it('should generate invoices including baseRent and additionalFees', async () => {
      mockTenantsFindMany = [
        {
          id: 'tenant-1',
          isActive: 1,
          room: {
            id: 'room-1',
            propertyId: 'prop-1',
            roomNumber: '101',
            monthlyRate: '1500000',
            additionalFees: [
              { name: 'Biaya Sampah & Kebersihan', amount: 50000 },
              { name: 'Parkir Motor', amount: 50000 }
            ]
          }
        }
      ]
      mockPaymentsFindFirst = null // No existing invoice

      const result = await generateMonthlyInvoices('prop-1', '2026-08', 'owner-1')
      expect(result.generatedCount).toBe(1)
      expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 'tenant-1',
        propertyId: 'prop-1',
        billingMonth: '2026-08',
        baseRent: '1500000',
        totalAmount: '1600000', // 1,500,000 + 50,000 + 50,000
        amountPaid: '0',
        status: 'unpaid'
      }))
    })

    it('should prevent duplicate invoices if already generated for the month', async () => {
      mockTenantsFindMany = [
        {
          id: 'tenant-1',
          isActive: 1,
          room: {
            id: 'room-1',
            propertyId: 'prop-1',
            monthlyRate: '1500000',
            additionalFees: []
          }
        }
      ]
      mockPaymentsFindFirst = { id: 'existing-pay-1' } // Already exists

      const result = await generateMonthlyInvoices('prop-1', '2026-08', 'owner-1')
      expect(result.generatedCount).toBe(0)
      expect(mockInsertValues).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/payments - Summary Aggregations', () => {
    it('should compute total billed, paid, and outstanding amounts', async () => {
      const handler = (await import('../../server/api/payments/index.get')).default
      mockPaymentsFindMany = [
        { id: 'pay-1', totalAmount: '2000000', amountPaid: '2000000', status: 'paid', transactions: [] },
        { id: 'pay-2', totalAmount: '1500000', amountPaid: '500000', status: 'partial', transactions: [] },
        { id: 'pay-3', totalAmount: '1500000', amountPaid: '0', status: 'unpaid', transactions: [] }
      ]

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      mockQuery = { propertyId: 'prop-1', billingMonth: '2026-08' }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.items.length).toBe(3)
      expect(res.data.summary.totalBilled).toBe(5000000)
      expect(res.data.summary.totalPaid).toBe(2500000)
      expect(res.data.summary.totalOutstanding).toBe(2500000)
      expect(res.data.summary.countPaid).toBe(1)
      expect(res.data.summary.countPartial).toBe(1)
      expect(res.data.summary.countUnpaid).toBe(1)
    })
  })
})
