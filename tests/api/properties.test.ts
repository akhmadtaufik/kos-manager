import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
let mockBody: any = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(mockBody)))
let mockParam: Record<string, string> = {}
vi.stubGlobal('getRouterParam', vi.fn((event: any, param: string) => mockParam[param]))
vi.stubGlobal('setResponseStatus', vi.fn())
vi.stubGlobal('createError', vi.fn((err: any) => {
  const error = new Error(err.statusMessage || err.message || 'Error') as any
  error.statusCode = err.statusCode || 500
  error.statusMessage = err.statusMessage
  error.data = err.data
  return error
}))

// Mock Drizzle DB
let mockFindPropertiesFirst: any = null
let mockPropertiesRows: any[] = []
const mockInsertReturning = vi.fn()
const mockUpdateReturning = vi.fn()
const mockDeleteReturning = vi.fn()

vi.mock('../../server/db', () => ({
  db: {
    query: {
      properties: {
        findFirst: vi.fn(() => Promise.resolve(mockFindPropertiesFirst))
      },
      users: {
        findFirst: vi.fn(() => Promise.resolve({ id: 'owner-1', role: 'owner' }))
      }
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          groupBy: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockPropertiesRows))
          })),
          where: vi.fn(() => ({
            groupBy: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve(mockPropertiesRows))
            }))
          }))
        }))
      }))
    })),
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

vi.mock('../../server/utils/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}))

vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ status: 'success', data, message })),
  sendSuccessResponse: vi.fn((event, data, statusCode, message) => ({ status: 'success', statusCode, data, message }))
}))

vi.mock('../../server/utils/rbac', () => ({
  requirePropertyOwnership: vi.fn((user, propertyId) => {
    if (!user) throw { statusCode: 401, statusMessage: 'Unauthorized' }
    if (user.role === 'superadmin') return Promise.resolve()
    if (user.role === 'operator') throw { statusCode: 403, statusMessage: 'Forbidden: Operators cannot perform this action' }
    if (!mockFindPropertiesFirst || mockFindPropertiesFirst.userId !== user.id) {
      throw { statusCode: 403, statusMessage: 'Forbidden: You do not own this property' }
    }
    return Promise.resolve()
  })
}))

describe('Properties API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockParam = {}
    mockFindPropertiesFirst = null
    mockPropertiesRows = []
  })

  describe('GET /api/properties', () => {
    it('should throw 401 when user is not authenticated', async () => {
      const handler = (await import('../../server/api/properties/index.get')).default
      const mockEvent = { context: {} }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    })

    it('should return properties with aggregated metrics (totalRooms, occupiedRooms)', async () => {
      const handler = (await import('../../server/api/properties/index.get')).default
      mockPropertiesRows = [
        {
          id: 'prop-1',
          userId: 'owner-1',
          name: 'Kos Sakura Melati',
          address: 'Jl. Margonda Raya No. 45',
          createdAt: new Date(),
          updatedAt: new Date(),
          totalRooms: 12,
          occupiedRooms: 9
        }
      ]

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.length).toBe(1)
      expect(res.data[0].name).toBe('Kos Sakura Melati')
      expect(res.data[0].totalRooms).toBe(12)
      expect(res.data[0].occupiedRooms).toBe(9)
    })
  })

  describe('POST /api/properties', () => {
    it('should throw 400 when property name is missing', async () => {
      const handler = (await import('../../server/api/properties/index.post')).default
      mockBody = { address: 'Jl. Mawar No. 10' } // Missing name
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Property name is required'
      })
    })

    it('should successfully create a new property', async () => {
      const handler = (await import('../../server/api/properties/index.post')).default
      mockBody = { name: 'Kos Anggrek Premium', address: 'Jl. Gejayan No. 20' }
      mockInsertReturning.mockResolvedValue([{
        id: 'prop-new-1',
        userId: 'owner-1',
        name: 'Kos Anggrek Premium',
        address: 'Jl. Gejayan No. 20'
      }])

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner', name: 'Owner Budi' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.name).toBe('Kos Anggrek Premium')
    })
  })

  describe('PATCH /api/properties/:id', () => {
    it('should throw 400 when name is empty', async () => {
      const handler = (await import('../../server/api/properties/[id].patch')).default
      mockParam = { id: 'prop-1' }
      mockBody = { name: '' }
      mockFindPropertiesFirst = { id: 'prop-1', userId: 'owner-1' }
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Property name is required'
      })
    })

    it('should update property details when called by Owner', async () => {
      const handler = (await import('../../server/api/properties/[id].patch')).default
      mockParam = { id: 'prop-1' }
      mockBody = { name: 'Kos Sakura Updated', address: 'Jl. Margonda Baru' }
      mockFindPropertiesFirst = { id: 'prop-1', userId: 'owner-1' }
      mockUpdateReturning.mockResolvedValue([{
        id: 'prop-1',
        userId: 'owner-1',
        name: 'Kos Sakura Updated',
        address: 'Jl. Margonda Baru'
      }])

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.name).toBe('Kos Sakura Updated')
    })
  })

  describe('DELETE /api/properties/:id', () => {
    it('should throw 403 when user does not own property', async () => {
      const handler = (await import('../../server/api/properties/[id].delete')).default
      mockParam = { id: 'prop-1' }
      mockFindPropertiesFirst = null // Different owner
      const mockEvent = { context: { user: { id: 'owner-other', role: 'owner' } } }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 403
      })
    })

    it('should delete property successfully for legitimate Owner', async () => {
      const handler = (await import('../../server/api/properties/[id].delete')).default
      mockParam = { id: 'prop-1' }
      mockFindPropertiesFirst = { id: 'prop-1', userId: 'owner-1' }
      mockDeleteReturning.mockResolvedValue([{ id: 'prop-1', name: 'Kos Sakura' }])

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.id).toBe('prop-1')
    })
  })
})
