import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
let mockBody: any = {}
vi.stubGlobal('readBody', vi.fn(() => Promise.resolve(mockBody)))
let mockParam = ''
vi.stubGlobal('getRouterParam', vi.fn(() => mockParam))
vi.stubGlobal('createError', vi.fn((err) => {
  const error = new Error(err.statusMessage || 'Error') as any
  error.statusCode = err.statusCode
  error.statusMessage = err.statusMessage
  return error
}))

// Mock Drizzle DB
const mockInsertResult = [{ id: 'cat-custom-1', name: 'Langganan CCTV', icon: 'PhVideoCamera', color: 'bg-violet-500', isSystem: 0 }]
const mockDeleteWhere = vi.fn().mockResolvedValue(true)
const mockFindManyResult: any[] = []
let mockFindFirstResult: any = null

vi.mock('../../server/db', () => ({
  db: {
    query: {
      expenseCategories: {
        findMany: vi.fn(() => Promise.resolve(mockFindManyResult)),
        findFirst: vi.fn(() => Promise.resolve(mockFindFirstResult)),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue(mockInsertResult)
      }))
    })),
    delete: vi.fn(() => ({
      where: mockDeleteWhere
    }))
  }
}))

// Mock Audit and Response Utils
vi.mock('../../server/utils/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true)
}))
vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ success: true, data, message }))
}))

import { logActivity } from '../../server/utils/audit'
import { db } from '../../server/db'

describe('Expense Categories API & Security Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody = {}
    mockParam = ''
    mockFindFirstResult = null
    mockFindManyResult.length = 0
  })

  describe('GET /api/expenses/categories', () => {
    it('should throw 401 when user is not authenticated', async () => {
      const getHandler = (await import('../../server/api/expenses/categories/index.get')).default
      const mockEvent = { context: {} }

      await expect(getHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    })

    it('should return all 9 professional default categories with correct icons and colors', async () => {
      const getHandler = (await import('../../server/api/expenses/categories/index.get')).default
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      const response: any = await getHandler(mockEvent as any)
      expect(response.success).toBe(true)
      expect(response.data.length).toBeGreaterThanOrEqual(9)

      const names = response.data.map((c: any) => c.name)
      expect(names).toContain('Listrik & Daya (PLN)')
      expect(names).toContain('Air Bersih & Sanitasi (PDAM)')
      expect(names).toContain('Kebersihan & Iuran Sampah')
      expect(names).toContain('Gaji & Honor Karyawan')
      expect(names).toContain('Pajak Bumi & Bangunan (PBB)')
      expect(names).toContain('Zakat & Infaq Usaha')
      expect(names).toContain('Santunan & Donasi Sosial')
      expect(names).toContain('Pemeliharaan & Renovasi')
      expect(names).toContain('Komisi & Marketing Agen')

      // Check PLN icon mapping
      const pln = response.data.find((c: any) => c.name === 'Listrik & Daya (PLN)')
      expect(pln.icon).toBe('PhLightning')
      expect(pln.color).toBe('bg-amber-500')
      expect(pln.isSystem).toBe(1)
    })

    it('should include user custom categories alongside system defaults', async () => {
      mockFindManyResult.push({
        id: 'cat-custom-1',
        userId: 'owner-1',
        name: 'Langganan CCTV',
        icon: 'PhVideoCamera',
        color: 'bg-violet-500',
        isSystem: 0
      })

      const getHandler = (await import('../../server/api/expenses/categories/index.get')).default
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      const response: any = await getHandler(mockEvent as any)
      const customCat = response.data.find((c: any) => c.name === 'Langganan CCTV')
      expect(customCat).toBeDefined()
      expect(customCat.icon).toBe('PhVideoCamera')
      expect(customCat.isSystem).toBe(0)
    })
  })

  describe('POST /api/expenses/categories', () => {
    it('should throw 401 if unauthenticated', async () => {
      const postHandler = (await import('../../server/api/expenses/categories/index.post')).default
      const mockEvent = { context: {} }

      await expect(postHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 401
      })
    })

    it('should throw 403 if user role is not owner or superadmin (RBAC check)', async () => {
      const postHandler = (await import('../../server/api/expenses/categories/index.post')).default
      const mockEvent = { context: { user: { id: 'user-op', role: 'operator' } } }

      await expect(postHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 403
      })
    })

    it('should throw 400 if category name is empty or whitespace', async () => {
      const postHandler = (await import('../../server/api/expenses/categories/index.post')).default
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      mockBody = { name: '   ', icon: 'PhTag' }

      await expect(postHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Nama kategori wajib diisi'
      })
    })

    it('should successfully create custom category and log activity audit', async () => {
      const postHandler = (await import('../../server/api/expenses/categories/index.post')).default
      const mockEvent = {
        context: {
          user: { id: 'owner-1', name: 'Budi Owner', role: 'owner' }
        }
      }
      mockBody = {
        name: 'Langganan CCTV',
        icon: 'PhVideoCamera',
        color: 'bg-violet-500'
      }

      const response: any = await postHandler(mockEvent as any)
      expect(response.success).toBe(true)
      expect(response.data.name).toBe('Langganan CCTV')
      expect(response.data.icon).toBe('PhVideoCamera')

      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'owner-1',
        action: 'CREATE',
        entityType: 'expense_category',
        entityId: 'cat-custom-1'
      }))
    })
  })

  describe('DELETE /api/expenses/categories/:id', () => {
    it('should reject deletion of system default categories (sys-*) with 400', async () => {
      const deleteHandler = (await import('../../server/api/expenses/categories/[id].delete')).default
      mockParam = 'sys-pln'
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(deleteHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Kategori bawaan sistem tidak dapat dihapus'
      })
    })

    it('should reject deletion of system category with isSystem = 1', async () => {
      const deleteHandler = (await import('../../server/api/expenses/categories/[id].delete')).default
      mockParam = 'uuid-pln'
      mockFindFirstResult = { id: 'uuid-pln', isSystem: 1, name: 'Listrik & Daya (PLN)' }
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(deleteHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Kategori bawaan sistem tidak dapat dihapus'
      })
    })

    it('should return 404 when deleting a non-existent category', async () => {
      const deleteHandler = (await import('../../server/api/expenses/categories/[id].delete')).default
      mockParam = 'non-existent-id'
      mockFindFirstResult = null
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(deleteHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Kategori tidak ditemukan'
      })
    })

    it('should return 403 when trying to delete another owner’s category (multi-tenant isolation)', async () => {
      const deleteHandler = (await import('../../server/api/expenses/categories/[id].delete')).default
      mockParam = 'cat-user-2'
      mockFindFirstResult = { id: 'cat-user-2', userId: 'owner-2', isSystem: 0, name: 'Other Owner Cat' }
      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }

      await expect(deleteHandler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'Anda tidak memiliki akses untuk menghapus kategori ini'
      })
    })

    it('should successfully delete custom category and log activity audit', async () => {
      const deleteHandler = (await import('../../server/api/expenses/categories/[id].delete')).default
      mockParam = 'cat-custom-1'
      mockFindFirstResult = { id: 'cat-custom-1', userId: 'owner-1', isSystem: 0, name: 'Langganan CCTV' }
      const mockEvent = {
        context: {
          user: { id: 'owner-1', name: 'Budi Owner', role: 'owner' }
        }
      }

      const response: any = await deleteHandler(mockEvent as any)
      expect(response.success).toBe(true)
      expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'owner-1',
        action: 'DELETE',
        entityType: 'expense_category',
        entityId: 'cat-custom-1'
      }))
    })
  })
})
