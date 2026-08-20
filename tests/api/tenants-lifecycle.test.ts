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
let mockTenantsFindFirst: any = null
let mockTenantsFindMany: any[] = []
let mockPaymentsFindMany: any[] = []
const mockInsertReturning = vi.fn()
const mockUpdateReturning = vi.fn()
const mockDeleteReturning = vi.fn()
const mockRoomUpdateSet = vi.fn(() => ({ where: vi.fn().mockResolvedValue(true) }))

vi.mock('../../server/db', () => ({
  db: {
    query: {
      tenants: {
        findFirst: vi.fn(() => Promise.resolve(mockTenantsFindFirst)),
        findMany: vi.fn(() => Promise.resolve(mockTenantsFindMany))
      },
      payments: {
        findMany: vi.fn(() => Promise.resolve(mockPaymentsFindMany))
      }
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mockInsertReturning
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: mockUpdateReturning
        }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: mockDeleteReturning
      }))
    }))
  }
}))

vi.mock('../../server/services/tenant.service', () => ({
  createTenant: vi.fn().mockResolvedValue({
    id: 'tenant-new-1',
    name: 'Andi Saputra',
    roomId: 'room-1',
    isActive: 1
  })
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

describe('Tenants Lifecycle & 360 Profile API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockQuery = {}
    mockParam = {}
    mockTenantsFindFirst = null
    mockTenantsFindMany = []
    mockPaymentsFindMany = []
  })

  describe('GET /api/tenants/:id - 360 Profile & Arrears Ledger', () => {
    it('should throw 404 when tenant is not found', async () => {
      const handler = (await import('../../server/api/tenants/[id].get')).default
      mockParam = { id: 'tenant-404' }
      mockTenantsFindFirst = null
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Tenant not found'
      })
    })

    it('should aggregate outstanding arrears and resolve Kemendagri location', async () => {
      const handler = (await import('../../server/api/tenants/[id].get')).default
      mockParam = { id: 'tenant-1' }
      mockTenantsFindFirst = {
        id: 'tenant-1',
        name: 'Budi Santoso',
        phone: '08123456789',
        provinceId: '31',
        regencyId: '3171',
        districtId: '3171010',
        room: {
          id: 'room-1',
          propertyId: 'prop-1',
          roomNumber: '101',
          monthlyRate: '1500000',
          property: { id: 'prop-1', name: 'Kos Melati' }
        }
      }
      mockPaymentsFindMany = [
        { id: 'pay-1', billingMonth: '2026-08', totalAmount: '1500000', amountPaid: '500000', status: 'partial', transactions: [] },
        { id: 'pay-2', billingMonth: '2026-07', totalAmount: '1500000', amountPaid: '1500000', status: 'paid', transactions: [] }
      ]

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.name).toBe('Budi Santoso')
      expect(res.data.financial.totalArrears).toBe(1000000) // 1.5M - 0.5M
      expect(res.data.location.province).toBe('DKI JAKARTA')
      expect(res.data.location.regency).toBe('KOTA ADM. JAKARTA PUSAT')
      expect(res.data.location.district).toBe('GAMBIR')
    })
  })

  describe('PATCH /api/tenants/:id - Checkout Action', () => {
    it('should release room and mark tenant as inactive on checkout', async () => {
      const handler = (await import('../../server/api/tenants/[id].patch')).default
      mockParam = { id: 'tenant-1' }
      mockBody = { action: 'checkout' }
      mockTenantsFindFirst = {
        id: 'tenant-1',
        name: 'Budi Santoso',
        roomId: 'room-1',
        isActive: 1,
        room: { id: 'room-1', propertyId: 'prop-1', roomNumber: '101' }
      }
      mockUpdateReturning.mockResolvedValue([{
        id: 'tenant-1',
        name: 'Budi Santoso',
        isActive: 0
      }])

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.isActive).toBe(0)
    })
  })
})
