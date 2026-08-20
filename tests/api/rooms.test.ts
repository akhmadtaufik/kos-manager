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
let mockRoomsFindFirst: any = null
let mockRoomsFindMany: any[] = []
const mockInsertReturning = vi.fn()
const mockUpdateReturning = vi.fn()
const mockDeleteReturning = vi.fn()

vi.mock('../../server/db', () => ({
  db: {
    query: {
      rooms: {
        findFirst: vi.fn(() => Promise.resolve(mockRoomsFindFirst)),
        findMany: vi.fn(() => Promise.resolve(mockRoomsFindMany))
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
  requirePropertyAccess: vi.fn((user, propertyId) => {
    if (!user) throw { statusCode: 401, statusMessage: 'Unauthorized' }
    return Promise.resolve()
  }),
  requirePropertyPermission: vi.fn((user, propertyId, perm) => {
    if (!user) throw { statusCode: 401, statusMessage: 'Unauthorized' }
    return Promise.resolve()
  }),
  requirePropertyOwnership: vi.fn((user, propertyId) => {
    if (!user) throw { statusCode: 401, statusMessage: 'Unauthorized' }
    if (user.role === 'operator') throw { statusCode: 403, statusMessage: 'Forbidden: Operators cannot perform this action' }
    return Promise.resolve()
  })
}))

describe('Rooms API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockQuery = {}
    mockParam = {}
    mockRoomsFindFirst = null
    mockRoomsFindMany = []
  })

  describe('GET /api/rooms', () => {
    it('should retrieve list of rooms for target property', async () => {
      const handler = (await import('../../server/api/rooms/index.get')).default
      mockRoomsFindMany = [
        { id: 'room-1', propertyId: 'prop-1', roomNumber: '101', status: 'available', monthlyRate: '1500000' },
        { id: 'room-2', propertyId: 'prop-1', roomNumber: '102', status: 'occupied', monthlyRate: '1600000' }
      ]

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      mockQuery = { propertyId: 'prop-1' }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.length).toBe(2)
      expect(res.data[0].roomNumber).toBe('101')
    })
  })

  describe('POST /api/rooms', () => {
    it('should reject missing required roomNumber or monthlyRate with 400', async () => {
      const handler = (await import('../../server/api/rooms/index.post')).default
      mockBody = { propertyId: 'prop-1', roomNumber: '' } // missing rate and number
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })

    it('should create room with additionalFees successfully', async () => {
      const handler = (await import('../../server/api/rooms/index.post')).default
      mockBody = {
        propertyId: 'prop-1',
        roomNumber: '201',
        monthlyRate: 1750000,
        additionalFees: [{ name: 'AC & Listrik Tambahan', amount: 200000 }]
      }
      mockInsertReturning.mockResolvedValue([{
        id: 'room-new-1',
        propertyId: 'prop-1',
        roomNumber: '201',
        monthlyRate: '1750000',
        status: 'available',
        additionalFees: [{ name: 'AC & Listrik Tambahan', amount: 200000 }]
      }])

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner', name: 'Owner Budi' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.roomNumber).toBe('201')
      expect(res.data.additionalFees.length).toBe(1)
    })
  })

  describe('PATCH /api/rooms/:id', () => {
    it('should throw 404 when room is not found', async () => {
      const handler = (await import('../../server/api/rooms/[id].patch')).default
      mockParam = { id: 'room-none' }
      mockRoomsFindFirst = null
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Room not found'
      })
    })

    it('should update room details and additionalFees', async () => {
      const handler = (await import('../../server/api/rooms/[id].patch')).default
      mockParam = { id: 'room-1' }
      mockRoomsFindFirst = { id: 'room-1', propertyId: 'prop-1', roomNumber: '101', monthlyRate: '1500000' }
      mockBody = { roomNumber: '101-A', monthlyRate: 1600000, additionalFees: [] }
      mockUpdateReturning.mockResolvedValue([{
        id: 'room-1',
        propertyId: 'prop-1',
        roomNumber: '101-A',
        monthlyRate: '1600000',
        additionalFees: []
      }])

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner', name: 'Owner' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.roomNumber).toBe('101-A')
      expect(res.data.monthlyRate).toBe('1600000')
    })
  })

  describe('DELETE /api/rooms/:id', () => {
    it('should throw 400 if room has foreign key constraints (active tenants/payments)', async () => {
      const handler = (await import('../../server/api/rooms/[id].delete')).default
      mockParam = { id: 'room-1' }
      mockRoomsFindFirst = { id: 'room-1', propertyId: 'prop-1', roomNumber: '101' }
      
      const dbModule: any = await import('../../server/db')
      dbModule.db.delete.mockReturnValueOnce({
        where: vi.fn(() => ({
          returning: vi.fn().mockRejectedValue({ code: '23503' }) // Postgres FK violation code
        }))
      })

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })

    it('should delete vacant room successfully', async () => {
      const handler = (await import('../../server/api/rooms/[id].delete')).default
      mockParam = { id: 'room-1' }
      mockRoomsFindFirst = { id: 'room-1', propertyId: 'prop-1', roomNumber: '101' }
      mockDeleteReturning.mockResolvedValue([{ id: 'room-1', roomNumber: '101' }])

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.id).toBe('room-1')
    })
  })
})
