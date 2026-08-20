import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
let mockQuery: any = {}
vi.stubGlobal('getQuery', vi.fn(() => mockQuery))
vi.stubGlobal('setResponseStatus', vi.fn())
vi.stubGlobal('createError', vi.fn((err: any) => {
  const error = new Error(err.statusMessage || err.message || 'Error') as any
  error.statusCode = err.statusCode || 500
  error.statusMessage = err.statusMessage
  error.data = err.data
  return error
}))

// Mock Auth
let mockSessionUser: any = null
vi.mock('#auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(mockSessionUser ? { user: mockSessionUser } : null))
}))

// Mock DB
let mockActivityLogsRows: any[] = []
let mockUsersFindMany: any[] = []
let mockUsersFindFirst: any = null

vi.mock('../../server/db', () => ({
  db: {
    query: {
      users: {
        findMany: vi.fn(() => Promise.resolve(mockUsersFindMany)),
        findFirst: vi.fn(() => Promise.resolve(mockUsersFindFirst))
      }
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve(mockActivityLogsRows))
            }))
          }))
        }))
      }))
    }))
  }
}))

vi.mock('../../server/utils/response', () => ({
  sendSuccessResponse: vi.fn((event, data, statusCode, message) => ({ status: 'success', data, message }))
}))

describe('Audit Trail & Operator Activity API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = {}
    mockSessionUser = null
    mockActivityLogsRows = []
    mockUsersFindMany = []
    mockUsersFindFirst = null
  })

  describe('GET /api/audit - Access Governance', () => {
    it('should throw 401 when user session is missing', async () => {
      const handler = (await import('../../server/api/audit/index.get')).default
      mockSessionUser = null
      const mockEvent = {}

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    })

    it('should throw 403 when operator attempts to access owner audit trail', async () => {
      const handler = (await import('../../server/api/audit/index.get')).default
      mockSessionUser = { id: 'op-1', role: 'operator' }
      const mockEvent = {}

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'Forbidden: Owners only'
      })
    })
  })

  describe('GET /api/audit/operators - Operator Directory for Filter Dropdowns', () => {
    it('should return operator itself when requested by operator', async () => {
      const handler = (await import('../../server/api/audit/operators.get')).default
      mockSessionUser = { id: 'op-1', role: 'operator' }
      mockUsersFindFirst = { id: 'op-1', name: 'Staff Andi', role: 'operator', email: 'andi@kos.com' }

      const mockEvent = {}
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.data.data.length).toBe(1)
      expect(res.data.data[0].name).toBe('Staff Andi')
    })
  })
})
