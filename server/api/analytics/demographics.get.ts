import { db } from '../../db'
import { tenants, rooms } from '../../db/schema'
import { and, eq, inArray, count } from 'drizzle-orm'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { getKemendagriProvinces, getKemendagriRegencies } from '../../utils/kemendagri'

defineRouteMeta({
  openAPI: {
    tags: ['Analytics'],
    summary: 'Retrieve Tenant Demographics (Kemendagri Standard)',
    description: 'Fetches analytical distribution of tenant origins strictly mapped to official Indonesian Kemendagri geographical codes, differentiating between Kota and Kabupaten.',
    parameters: [
      {
        name: 'propertyId',
        in: 'query',
        required: false,
        schema: { type: 'string' },
        description: 'Target property ID to filter tenant demographics.'
      },
      {
        name: 'level',
        in: 'query',
        required: false,
        schema: { type: 'string', enum: ['regency', 'province'], default: 'regency' },
        description: 'Geographical granularity level: regency (Kabupaten/Kota) or province (Provinsi).'
      }
    ],
    responses: {
      200: {
        description: 'Demographic distribution array with counts, percentages, and official names.'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const level = (query.level as string) || 'regency' // 'regency' (default) or 'province'
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined' && propertyId !== '') {
    await requirePropertyPermission(user, propertyId, 'reports:read')
    targetPropertyIds = [propertyId]
  } else {
    // Global view
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  if (targetPropertyIds.length === 0) {
    return apiSuccess([])
  }

  const allProvinces = getKemendagriProvinces()
  const allRegencies = getKemendagriRegencies()

  if (level === 'province') {
    const results = await db.select({
        provinceId: tenants.provinceId,
        total: count()
      })
      .from(tenants)
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .where(
        and(
          eq(tenants.isActive, 1),
          inArray(rooms.propertyId, targetPropertyIds)
        )
      )
      .groupBy(tenants.provinceId)

    const totalTenants = results.reduce((acc, curr) => acc + Number(curr.total), 0)

    const mapped = results.map(row => {
      const prov = allProvinces.find(p => p.id === row.provinceId)
      const name = prov ? prov.name : (row.provinceId ? `Provinsi ID: ${row.provinceId}` : 'Tidak Diketahui')
      const total = Number(row.total)
      const percentage = totalTenants > 0 ? Math.round((total / totalTenants) * 1000) / 10 : 0

      return {
        id: row.provinceId || 'unknown',
        provinceId: row.provinceId || 'unknown',
        name,
        type: 'PROVINSI',
        provinceName: name,
        total,
        percentage
      }
    }).sort((a, b) => b.total - a.total)

    return apiSuccess(mapped)
  }

  // Default: level === 'regency' (strictly grouping and labeling KOTA vs KABUPATEN)
  const results = await db.select({
      regencyId: tenants.regencyId,
      provinceId: tenants.provinceId,
      total: count()
    })
    .from(tenants)
    .innerJoin(rooms, eq(tenants.roomId, rooms.id))
    .where(
      and(
        eq(tenants.isActive, 1),
        inArray(rooms.propertyId, targetPropertyIds)
      )
    )
    .groupBy(tenants.regencyId, tenants.provinceId)

  const totalTenants = results.reduce((acc, curr) => acc + Number(curr.total), 0)

  const mapped = results.map(row => {
    const reg = allRegencies.find(r => r.id === row.regencyId)
    const prov = allProvinces.find(p => p.id === (row.provinceId || reg?.provinceId))

    let name = 'Tidak Diketahui'
    let type: 'KOTA' | 'KABUPATEN' | 'LAINNYA' = 'LAINNYA'

    if (reg) {
      name = reg.name
      type = reg.type
    } else if (row.regencyId) {
      name = `Wilayah ID: ${row.regencyId}`
    }

    const total = Number(row.total)
    const percentage = totalTenants > 0 ? Math.round((total / totalTenants) * 1000) / 10 : 0

    return {
      id: row.regencyId || 'unknown',
      regencyId: row.regencyId || 'unknown',
      provinceId: row.provinceId || reg?.provinceId || 'unknown',
      name,
      type,
      provinceName: prov ? prov.name : '-',
      total,
      percentage
    }
  }).sort((a, b) => b.total - a.total)

  return apiSuccess(mapped)
})

