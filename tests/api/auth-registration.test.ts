import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
let mockBody: any = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(mockBody)))
vi.stubGlobal('setResponseStatus', vi.fn())
vi.stubGlobal('createError', vi.fn((err: any) => {
  const error = new Error(err.statusMessage || err.message || 'Error') as any
  error.statusCode = err.statusCode || 500
  error.statusMessage = err.statusMessage
  error.data = err.data
  return error
}))

// Mock DB
let mockExistingUser: any = null
const mockInsertReturning = vi.fn()
const mockUpdateSet = vi.fn(() => ({ where: vi.fn().mockResolvedValue(true) }))

vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve(mockExistingUser ? [mockExistingUser] : []))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: mockInsertReturning
      }))
    })),
    update: vi.fn(() => ({ set: mockUpdateSet }))
  },
  users: {
    id: 'id',
    name: 'name',
    email: 'email',
    password: 'password',
    role: 'role',
    createdAt: 'createdAt'
  }
}))

vi.mock('../../server/utils/hash', () => ({
  hashPassword: vi.fn(() => Promise.resolve('$2b$10$mockedhashedpassword123'))
}))

vi.mock('../../server/utils/response', () => ({
  sendSuccessResponse: vi.fn((event, data, statusCode, message) => ({ status: 'success', statusCode, data, message })),
  apiSuccess: vi.fn((data, message) => ({ status: 'success', data, message }))
}))

describe('Auth Registration & User Onboarding API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockExistingUser = null
  })

  describe('POST /api/auth/register', () => {
    it('should reject invalid email and short password with 400', async () => {
      const handler = (await import('../../server/api/auth/register.post')).default
      mockBody = { name: 'Andi', email: 'not-an-email', password: '123' } // password < 6 chars
      const mockEvent = {}

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })

    it('should reject duplicate email registration with 409', async () => {
      const handler = (await import('../../server/api/auth/register.post')).default
      mockBody = { name: 'Andi', email: 'andi@kos.com', password: 'password123', role: 'owner' }
      mockExistingUser = { id: 'existing-1', email: 'andi@kos.com' }
      const mockEvent = {}

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Email sudah terdaftar'
      })
    })

    it('should successfully register new user with hashed password', async () => {
      const handler = (await import('../../server/api/auth/register.post')).default
      mockBody = { name: 'Budi Hartono', email: 'budi@kos.com', password: 'secretpassword', role: 'owner' }
      mockExistingUser = null
      mockInsertReturning.mockResolvedValue([{
        id: 'user-new-1',
        name: 'Budi Hartono',
        email: 'budi@kos.com',
        role: 'owner',
        createdAt: new Date()
      }])

      const mockEvent = {}
      const res: any = await handler(mockEvent as any)

      expect(res.status).toBe('success')
      expect(res.statusCode).toBe(201)
      expect(res.data.email).toBe('budi@kos.com')
    })
  })

  describe('POST /api/user/role - Role Selection Onboarding', () => {
    it('should reject role change if user role is not pending', async () => {
      const handler = (await import('../../server/api/user/role.post')).default
      mockBody = { role: 'owner' }
      const mockEvent = { context: { user: { id: 'user-1', role: 'owner' } } } // Already owner

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Role has already been set'
      })
    })

    it('should allow pending user to select owner role', async () => {
      const handler = (await import('../../server/api/user/role.post')).default
      mockBody = { role: 'owner' }
      const mockEvent = { context: { user: { id: 'user-pending', role: 'pending' } } }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(mockUpdateSet).toHaveBeenCalledWith({ role: 'owner' })
    })
  })
})
