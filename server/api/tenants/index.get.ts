import { getTenantsByProperty } from '../../services/tenant.service'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { selectTenantSchema, insertTenantSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Tenants'],
    summary: 'List All Tenants',
    description: 'Retrieves a directory of all tenants. Can be filtered by active status, property, or room.'
  }
})
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined') {
    await requirePropertyPermission(user, propertyId)
    targetPropertyIds = [propertyId]
  } else {
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  const tenantsData = await getTenantsByProperty(targetPropertyIds)
  
  return apiSuccess(tenantsData, 'Tenants retrieved successfully')
})
