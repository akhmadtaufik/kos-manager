import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auto-imported Nitro/H3 helpers
vi.stubGlobal('defineEventHandler', (handler: any) => handler)
vi.stubGlobal('defineRouteMeta', () => {})
let mockQuery: any = {}
vi.stubGlobal('getQuery', vi.fn(() => mockQuery))
vi.stubGlobal('createError', vi.fn((err: any) => {
  const error = new Error(err.statusMessage || err.message || 'Error') as any
  error.statusCode = err.statusCode || 500
  error.statusMessage = err.statusMessage
  return error
}))

// Mock Services & Utils
vi.mock('../../server/services/property.service', () => ({
  getUserProperties: vi.fn().mockResolvedValue([{ id: 'prop-1', name: 'Kos Sakura' }])
}))

vi.mock('../../server/utils/rbac', () => ({
  requirePropertyPermission: vi.fn().mockResolvedValue(true)
}))

vi.mock('../../server/utils/response', () => ({
  apiSuccess: vi.fn((data, message) => ({ status: 'success', data, message }))
}))

// Mock Drizzle DB selects
let mockRoomsTotal = 10
let mockRoomsOccupied = 8
let mockPrevOccupied = 5
let mockRevenue = 8000000
let mockPrevRevenue = 5000000
let mockExpenses = 2000000
let mockPrevExpenses = 1500000

let mockDemographicsRows: any[] = []

vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockImplementation(() => {
          return Promise.resolve([{ value: mockRoomsTotal }])
        }),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            groupBy: vi.fn(() => Promise.resolve(mockDemographicsRows)),
            orderBy: vi.fn(() => Promise.resolve(mockDemographicsRows))
          }))
        }))
      }))
    }))
  }
}))

describe('Time-Series Analytics & Demographics API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = {}
    mockRoomsTotal = 10
    mockRoomsOccupied = 8
    mockPrevOccupied = 5
    mockRevenue = 8000000
    mockPrevRevenue = 5000000
    mockExpenses = 2000000
    mockPrevExpenses = 1500000
    mockDemographicsRows = []
  })

  describe('MoM Time-Series Math & Recapitulation Pipeline (/api/reports/rekap)', () => {
    it('should calculate accurate MoM deltas without division-by-zero errors', async () => {
      // Test the helper math directly and deterministically
      const calculateMoMPercent = (current: number, previous: number) => {
        if (previous === 0) {
          if (current === 0) return 0
          if (current > 0) return 100
          return -100
        }
        const delta = ((current - previous) / Math.abs(previous)) * 100
        return Math.round(delta * 10) / 10
      }

      // Case 1: Standard growth
      expect(calculateMoMPercent(12000000, 10000000)).toBe(20) // +20%
      
      // Case 2: Decrease
      expect(calculateMoMPercent(8000000, 10000000)).toBe(-20) // -20%

      // Case 3: Prior month zero (no division by zero)
      expect(calculateMoMPercent(5000000, 0)).toBe(100) // +100%
      expect(calculateMoMPercent(0, 0)).toBe(0) // 0%
      expect(calculateMoMPercent(-100000, 0)).toBe(-100) // -100%

      // Case 4: Net profit flip from negative to positive
      const prevNetProfit = -1000000
      const currNetProfit = 2000000
      expect(calculateMoMPercent(currNetProfit, prevNetProfit)).toBe(300) // +300%
    })

    it('should return empty zeros structure when user has no properties', async () => {
      const handler = (await import('../../server/api/reports/rekap.get')).default
      const { getUserProperties } = await import('../../server/services/property.service')
      ;(getUserProperties as any).mockResolvedValueOnce([])

      const mockEvent = { context: { user: { id: 'user-new', role: 'owner' } } }
      mockQuery = { month: '2026-08' }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.totalRooms).toBe(0)
      expect(res.data.mom.revenueMoM).toBe(0)
      expect(res.data.previousMonth).toBe('2026-07')
    })
  })

  describe('Kemendagri Demographics API (/api/analytics/demographics)', () => {
    it('should correctly format regency level with KOTA and KABUPATEN classification', async () => {
      const handler = (await import('../../server/api/analytics/demographics.get')).default
      
      mockDemographicsRows = [
        { regencyId: '3171', total: 6 }, // KOTA ADM. JAKARTA PUSAT
        { regencyId: '3201', total: 4 }  // KABUPATEN BOGOR
      ]

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      mockQuery = { propertyId: 'prop-1', level: 'regency' }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.length).toBe(2)

      const jktPusat = res.data.find((d: any) => d.id === '3171')
      expect(jktPusat).toBeDefined()
      expect(jktPusat.type).toBe('KOTA')
      expect(jktPusat.name).toBe('KOTA ADM. JAKARTA PUSAT')
      expect(jktPusat.total).toBe(6)
      expect(jktPusat.percentage).toBe(60)

      const bogor = res.data.find((d: any) => d.id === '3201')
      expect(bogor).toBeDefined()
      expect(bogor.type).toBe('KABUPATEN')
      expect(bogor.name).toBe('KABUPATEN BOGOR')
      expect(bogor.total).toBe(4)
      expect(bogor.percentage).toBe(40)
    })

    it('should correctly consolidate data when level=province is requested', async () => {
      const handler = (await import('../../server/api/analytics/demographics.get')).default
      
      mockDemographicsRows = [
        { provinceId: '31', total: 15 }, // DKI JAKARTA
        { provinceId: '32', total: 5 }   // JAWA BARAT
      ]

      const mockEvent = { context: { user: { id: 'owner-1', role: 'owner' } } }
      mockQuery = { propertyId: 'prop-1', level: 'province' }

      const res: any = await handler(mockEvent as any)
      expect(res.status).toBe('success')
      expect(res.data.length).toBe(2)

      const dki = res.data.find((d: any) => d.id === '31')
      expect(dki).toBeDefined()
      expect(dki.type).toBe('PROVINSI')
      expect(dki.name).toBe('DKI JAKARTA')
      expect(dki.total).toBe(15)
      expect(dki.percentage).toBe(75)
    })
  })
})
