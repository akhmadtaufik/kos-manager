import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
let mockBody: any = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(mockBody)))
let mockQuery: any = {}
vi.stubGlobal('getQuery', vi.fn(() => mockQuery))
let mockParam = ''
vi.stubGlobal('getRouterParam', vi.fn(() => mockParam))
vi.stubGlobal('createError', vi.fn((err) => {
  const error = new Error(err.statusMessage || 'Error') as any
  error.statusCode = err.statusCode
  error.statusMessage = err.statusMessage
  return error
}))

// Mock DB
let mockFindManyResult: any[] = []
let mockFindFirstResult: any = null
const mockUpdateSet = vi.fn(() => ({
  where: vi.fn(() => ({
    returning: vi.fn().mockResolvedValue([{
      id: 'exp-1',
      propertyId: 'prop-1',
      category: 'Listrik & Daya (PLN)',
      amount: '150000',
      description: 'Token listrik lantai 1',
      date: new Date('2026-08-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    }])
  }))
}))

vi.mock('../../server/db', () => ({
  db: {
    query: {
      expenses: {
        findMany: vi.fn(() => Promise.resolve(mockFindManyResult)),
        findFirst: vi.fn(() => Promise.resolve(mockFindFirstResult)),
      },
    },
    update: vi.fn(() => ({
      set: mockUpdateSet
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(true)
    }))
  }
}))

// Mock RBAC & Services & Audit & Response
vi.mock('../../server/utils/rbac', () => ({
  requirePropertyAccess: vi.fn().mockResolvedValue(true),
  requirePropertyPermission: vi.fn().mockResolvedValue(true)
}))
vi.mock('../../server/services/property.service', () => ({
  getUserProperties: vi.fn().mockResolvedValue([{ id: 'prop-1', name: 'Kos Melati' }])
}))
vi.mock('../../server/utils/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}))
vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ success: true, data, message }))
}))

import { logActivity } from '../../server/utils/audit'
import { requirePropertyPermission } from '../../server/utils/rbac'
import { db } from '../../server/db'

describe('Expenses API & PATCH Endpoint Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockQuery = {}
    mockParam = ''
    mockFindFirstResult = null
    mockFindManyResult = []
  })

  describe('GET /api/expenses with Month/Year Filter', () => {
    it('should pass month and year query parameters to expense retrieval', async () => {
      const getHandler = (await import('../../server/api/expenses/index.get')).default
      mockQuery = { propertyId: 'prop-1', month: '8', year: '2026' }
      const mockEvent = { context: { user: { id: 'user-1', role: 'owner' } } }

      mockFindManyResult = [
        {
          id: 'exp-1',
          propertyId: 'prop-1',
          category: 'Listrik & Daya (PLN)',
          amount: '150000',
          date: new Date('2026-08-15')
        }
      ]

      const response: any = await getHandler(mockEvent as any)
      expect(response.success).toBe(true)
      expect(response.data.length).toBe(1)
      expect(db.query.expenses.findMany).toHaveBeenCalled()
    })
  })

  describe('PATCH /api/expenses/:id', () => {
    it('should throw 400 if ID param is missing', async () => {
      const patchHandler = (await import('../../server/api/expenses/[id].patch')).default
      mockParam = ''
      const mockEvent = { context: { user: { id: 'user-1', role: 'owner' } } }

      await expect(patchHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })

    it('should throw 404 if expense record does not exist', async () => {
      const patchHandler = (await import('../../server/api/expenses/[id].patch')).default
      mockParam = 'non-existent-exp'
      mockFindFirstResult = null
      const mockEvent = { context: { user: { id: 'user-1', role: 'owner' } } }

      await expect(patchHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Pengeluaran tidak ditemukan'
      })
    })

    it('should check RBAC manage_expenses permission', async () => {
      const patchHandler = (await import('../../server/api/expenses/[id].patch')).default
      mockParam = 'exp-1'
      mockFindFirstResult = {
        id: 'exp-1',
        propertyId: 'prop-1',
        category: 'Listrik & Daya (PLN)',
        amount: '100000',
        date: new Date('2026-08-10')
      }
      mockBody = {
        amount: '150000',
        category: 'Listrik & Daya (PLN)',
        date: '2026-08-15'
      }
      const mockEvent = { context: { user: { id: 'user-1', role: 'owner' } } }

      await patchHandler(mockEvent as any)
      expect(requirePropertyPermission).toHaveBeenCalledWith(
        mockEvent.context.user,
        'prop-1',
        'expenses:update'
      )
    })

    it('should reject invalid date format with 400', async () => {
      const patchHandler = (await import('../../server/api/expenses/[id].patch')).default
      mockParam = 'exp-1'
      mockFindFirstResult = {
        id: 'exp-1',
        propertyId: 'prop-1',
        category: 'Listrik & Daya (PLN)',
        amount: '100000',
        date: new Date('2026-08-10')
      }
      mockBody = {
        date: 'invalid-date'
      }
      const mockEvent = { context: { user: { id: 'user-1', role: 'owner' } } }

      await expect(patchHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })

    it('should successfully update expense and log audit activity', async () => {
      const patchHandler = (await import('../../server/api/expenses/[id].patch')).default
      mockParam = 'exp-1'
      mockFindFirstResult = {
        id: 'exp-1',
        propertyId: 'prop-1',
        category: 'Listrik & Daya (PLN)',
        amount: '100000',
        description: 'Old description',
        date: new Date('2026-08-10')
      }
      mockBody = {
        category: 'Air Bersih & Sanitasi (PDAM)',
        amount: 175000,
        description: 'Tagihan PDAM Agustus 2026',
        date: '2026-08-18'
      }
      const mockEvent = { context: { user: { id: 'user-1', name: 'Owner User', role: 'owner' } } }

      const response: any = await patchHandler(mockEvent as any)
      expect(response.success).toBe(true)
      expect(db.update).toHaveBeenCalled()
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        action: 'UPDATE',
        entityType: 'expense',
        entityId: 'exp-1'
      }))
    })
  })
})
