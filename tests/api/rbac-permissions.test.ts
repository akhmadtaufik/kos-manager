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

// Mock Drizzle DB
let mockFindPropertiesFirst: any = null
let mockFindUserPropertiesFirst: any = null
let mockFindUserPropertiesMany: any[] = []
let mockFindUsersFirst: any = null
const mockInsertValues = vi.fn().mockResolvedValue(true)
const mockUpdateSet = vi.fn(() => ({ where: vi.fn().mockResolvedValue(true) }))
const mockDeleteReturning = vi.fn().mockResolvedValue([{ userId: 'op-1', propertyId: 'prop-1' }])
const mockDeleteWhere = vi.fn(() => ({ returning: mockDeleteReturning }))

vi.mock('../../server/db', () => ({
  db: {
    query: {
      properties: {
        findFirst: vi.fn(() => Promise.resolve(mockFindPropertiesFirst))
      },
      userProperties: {
        findFirst: vi.fn(() => Promise.resolve(mockFindUserPropertiesFirst)),
        findMany: vi.fn(() => Promise.resolve(mockFindUserPropertiesMany))
      },
      users: {
        findFirst: vi.fn(() => Promise.resolve(mockFindUsersFirst))
      }
    },
    insert: vi.fn(() => ({ values: mockInsertValues })),
    update: vi.fn(() => ({ set: mockUpdateSet })),
    delete: vi.fn(() => ({ where: mockDeleteWhere }))
  }
}))

vi.mock('../../server/utils/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}))

vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ status: 'success', data, message }))
}))

import { requirePropertyOwnership, requirePropertyPermission, verifyPropertyPermission } from '../../server/utils/rbac'

describe('Security & RBAC Micro-Permissions API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockQuery = {}
    mockParam = {}
    mockFindPropertiesFirst = null
    mockFindUserPropertiesFirst = null
    mockFindUserPropertiesMany = []
    mockFindUsersFirst = null
  })

  describe('RBAC Micro-Permissions Helper (requirePropertyPermission)', () => {
    it('should throw 401 when user context is missing', async () => {
      await expect(requirePropertyPermission(undefined, 'prop-1', 'rooms:create')).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    })

    it('should grant access to superadmin unconditionally', async () => {
      const user = { id: 'admin-1', role: 'superadmin' }
      await expect(requirePropertyPermission(user, 'prop-1', 'rooms:create')).resolves.toBeUndefined()
    })

    it('should grant access to property owner', async () => {
      mockFindPropertiesFirst = { id: 'prop-1', userId: 'owner-1' }
      const user = { id: 'owner-1', role: 'owner' }
      await expect(requirePropertyPermission(user, 'prop-1', 'rooms:create')).resolves.toBeUndefined()
    })

    it('should throw 403 when owner does not own the property', async () => {
      mockFindPropertiesFirst = null
      const user = { id: 'owner-2', role: 'owner' }
      await expect(requirePropertyPermission(user, 'prop-1', 'rooms:create')).rejects.toMatchObject({
        statusCode: 403
      })
    })

    it('should throw 403 when operator lacks the specific micro-permission', async () => {
      mockFindUserPropertiesFirst = {
        userId: 'op-1',
        propertyId: 'prop-1',
        permissions: ['tenants:read', 'expenses:read'] // Does NOT have rooms:create
      }
      const user = { id: 'op-1', role: 'operator' }
      await expect(requirePropertyPermission(user, 'prop-1', 'rooms:create')).rejects.toMatchObject({
        statusCode: 403
      })
    })

    it('should allow operator with exact micro-permission', async () => {
      mockFindUserPropertiesFirst = {
        userId: 'op-1',
        propertyId: 'prop-1',
        permissions: ['rooms:create', 'rooms:read']
      }
      const user = { id: 'op-1', role: 'operator' }
      await expect(requirePropertyPermission(user, 'prop-1', 'rooms:create')).resolves.toBeUndefined()
    })

    it('should allow operator with corresponding legacy macro-permission', async () => {
      mockFindUserPropertiesFirst = {
        userId: 'op-1',
        propertyId: 'prop-1',
        permissions: ['manage_rooms'] // Maps to rooms:create, rooms:read, etc.
      }
      const user = { id: 'op-1', role: 'operator' }
      await expect(requirePropertyPermission(user, 'prop-1', 'rooms:create')).resolves.toBeUndefined()
    })
  })

  describe('GET /api/staff - Staff Directory Isolation', () => {
    it('should throw 403 when an operator attempts to access staff list', async () => {
      const handler = (await import('../../server/api/staff/index.get')).default
      mockQuery = { propertyId: 'prop-1' }
      mockFindPropertiesFirst = null // Operator does not own property
      const mockEvent = { context: { user: { id: 'op-1', role: 'operator' } } }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 403
      })
    })

    it('should return staff list with micro-permissions when requested by Owner', async () => {
      const handler = (await import('../../server/api/staff/index.get')).default
      mockQuery = { propertyId: 'prop-1' }
      mockFindPropertiesFirst = { id: 'prop-1', userId: 'owner-1' }
      mockFindUserPropertiesMany = [
        {
          assignedAt: '2026-08-01',
          permissions: ['rooms:read', 'payments:read'],
          user: { id: 'op-1', name: 'Staff Andi', email: 'andi@kos.com', role: 'operator' }
        }
      ]
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.length).toBe(1)
      expect(res.data[0].name).toBe('Staff Andi')
      expect(res.data[0].permissions).toEqual(['rooms:read', 'payments:read'])
    })
  })

  describe('POST /api/staff - Staff Invitation & Micro-Permission Assignment', () => {
    it('should throw 403 when an operator attempts to invite staff', async () => {
      const handler = (await import('../../server/api/staff/index.post')).default
      mockBody = { propertyId: 'prop-1', email: 'budi@kos.com', permissions: ['rooms:read'] }
      mockFindPropertiesFirst = null
      const mockEvent = { context: { user: { id: 'op-1', role: 'operator' } } }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 403
      })
    })

    it('should assign custom micro-permissions when invited by Owner', async () => {
      const handler = (await import('../../server/api/staff/index.post')).default
      mockBody = { 
        propertyId: 'prop-1', 
        email: 'budi@kos.com', 
        permissions: ['tenants:read', 'tenants:create', 'payments:read'] 
      }
      mockFindPropertiesFirst = { id: 'prop-1', userId: 'owner-1' }
      mockFindUsersFirst = { id: 'user-budi', email: 'budi@kos.com', role: 'pending' }
      mockFindUserPropertiesFirst = null // not assigned yet
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-budi',
        propertyId: 'prop-1',
        permissions: ['tenants:read', 'tenants:create', 'payments:read']
      }))
    })
  })

  describe('DELETE /api/staff/:userId - Staff Access Revocation', () => {
    it('should allow Owner to revoke operator access', async () => {
      const handler = (await import('../../server/api/staff/[userId].delete')).default
      mockParam = { userId: 'op-1' }
      mockQuery = { propertyId: 'prop-1' }
      mockFindPropertiesFirst = { id: 'prop-1', userId: 'owner-1' }
      mockFindUserPropertiesFirst = { userId: 'op-1', propertyId: 'prop-1' }
      mockFindUsersFirst = { id: 'op-1', name: 'Operator 1', email: 'op@kos.com' }
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(mockDeleteWhere).toHaveBeenCalled()
    })
  })
})
