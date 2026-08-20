import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
let mockQuery: any = {}
vi.stubGlobal('getQuery', vi.fn(() => mockQuery))

vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ status: 'success', data, message }))
}))

describe('Kemendagri Regions Cascading API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = {}
  })

  describe('GET /api/regions/provinces', () => {
    it('should return all official Indonesian provinces', async () => {
      const handler = (await import('../../server/api/regions/provinces.get')).default
      const mockEvent = {}

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(Array.isArray(res.data)).toBe(true)
      expect(res.data.length).toBeGreaterThanOrEqual(34)

      const dki = res.data.find((p: any) => p.id === '31')
      expect(dki).toBeDefined()
      expect(dki.name).toBe('DKI JAKARTA')
    })
  })

  describe('GET /api/regions/regencies', () => {
    it('should return regencies filtered by camelCase provinceId', async () => {
      const handler = (await import('../../server/api/regions/regencies.get')).default
      mockQuery = { provinceId: '31' }
      const mockEvent = {}

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.data.every((r: any) => r.provinceId === '31')).toBe(true)

      const names = res.data.map((r: any) => r.name)
      expect(names).toContain('KOTA ADM. JAKARTA PUSAT')
      expect(names).toContain('KOTA ADM. JAKARTA SELATAN')
    })

    it('should return regencies filtered by snake_case province_id', async () => {
      const handler = (await import('../../server/api/regions/regencies.get')).default
      mockQuery = { province_id: '32' } // Jawa Barat
      const mockEvent = {}

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.data.every((r: any) => r.provinceId === '32')).toBe(true)

      const names = res.data.map((r: any) => r.name)
      expect(names).toContain('KABUPATEN BOGOR')
      expect(names).toContain('KOTA BANDUNG')
    })
  })

  describe('GET /api/regions/districts', () => {
    it('should return districts filtered by camelCase regencyId', async () => {
      const handler = (await import('../../server/api/regions/districts.get')).default
      mockQuery = { regencyId: '3171' } // Jakarta Pusat
      const mockEvent = {}

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.data.every((d: any) => d.regencyId === '3171')).toBe(true)

      const names = res.data.map((d: any) => d.name)
      expect(names).toContain('GAMBIR')
      expect(names).toContain('MENTENG')
      expect(names).toContain('TANAH ABANG')
    })

    it('should return districts filtered by snake_case regency_id', async () => {
      const handler = (await import('../../server/api/regions/districts.get')).default
      mockQuery = { regency_id: '3201' } // Kabupaten Bogor
      const mockEvent = {}

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.length).toBeGreaterThan(0)
      expect(res.data.every((d: any) => d.regencyId === '3201')).toBe(true)

      const names = res.data.map((d: any) => d.name)
      expect(names).toContain('CIBINONG')
      expect(names).toContain('GUNUNG PUTRI')
    })
  })
})
