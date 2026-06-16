import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock globally auto-imported Nitro/H3 functions
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
let mockBody: any = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(mockBody)))
let mockParam = 'tenant-123'
vi.stubGlobal('getRouterParam', vi.fn(() => mockParam))
vi.stubGlobal('createError', vi.fn((err) => err))

// Mock Drizzle DB
const mockUpdateChain = {
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 'tenant-123' }])
}

vi.mock('../../server/db', () => ({
  db: {
    query: {
      tenants: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'tenant-123',
          roomId: 'room-1',
          name: 'Old Name',
          room: { propertyId: 'prop-1', roomNumber: '101' }
        })
      }
    },
    update: vi.fn(() => mockUpdateChain)
  }
}))

vi.mock('../../server/db/schema', () => ({
  tenants: { id: 'tenantIdCol' },
  rooms: { id: 'roomIdCol' }
}))

// Mock Services
vi.mock('../../server/services/tenant.service', () => ({
  createTenant: vi.fn().mockResolvedValue({ id: 'new-tenant-123' })
}))

// Mock Utils
vi.mock('../../server/utils/rbac', () => ({
  requirePropertyPermission: vi.fn().mockResolvedValue(true)
}))
vi.mock('../../server/utils/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}))
vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ success: true, data, message }))
}))

import { createTenant } from '../../server/services/tenant.service'
import { db } from '../../server/db'

// We will dynamically import the handlers inside the tests to avoid hoisting issues with globals.

describe('Tenants API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/tenants', () => {
    it('should correctly accept, process, and map provinceId, regencyId, and districtId', async () => {
      mockBody = {
        propertyId: 'prop-1',
        roomId: 'room-1',
        name: 'John Doe',
        phone: '081234567890',
        checkIn: '2026-06-01',
        provinceId: '31',
        regencyId: '3171',
        districtId: '3171010' // New demographic payload
      }

      const mockEvent = { context: { user: { id: 'user-1' } } }
      const handlerModule = await import('../../server/api/tenants/index.post')
      const response = await handlerModule.default(mockEvent as any)
      
      expect(response.success).toBe(true)
      expect(createTenant).toHaveBeenCalledWith(
        mockEvent.context.user,
        'prop-1',
        expect.objectContaining({
          roomId: 'room-1',
          name: 'John Doe',
          provinceId: '31',
          regencyId: '3171',
          districtId: '3171010' // Verifying districtId is mapped
        })
      )
    })
  })

  describe('PATCH /api/tenants/:id', () => {
    it('should correctly accept and update provinceId, regencyId, and districtId', async () => {
      mockBody = {
        action: 'update',
        name: 'John Doe Updated',
        phone: '081234567890',
        checkIn: '2026-06-01',
        provinceId: '32',
        regencyId: '3201',
        districtId: '3201010' // New demographic payload
      }

      const mockEvent = { context: { user: { id: 'user-1' } } }
      const handlerModule = await import('../../server/api/tenants/[id].patch')
      const response = await handlerModule.default(mockEvent as any)
      
      expect(response.success).toBe(true)
      
      // Verify Drizzle ORM update was called with the correct demographic fields
      expect(mockUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe Updated',
          provinceId: '32',
          regencyId: '3201',
          districtId: '3201010' // Verifying districtId is saved to DB
        })
      )
    })
  })
})
