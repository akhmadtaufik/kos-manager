import { createTenant } from '../../services/tenant.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { logActivity } from '../../utils/audit'
import { selectTenantSchema, insertTenantSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Tenants'],
    summary: 'Register New Tenant',
    description: 'Registers a new tenant, capturing their personal data, identity documents, and assigning them to a specific room.'
  }
})
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const propertyId = body.propertyId

  if (!propertyId || !body.roomId || !body.name || !body.checkIn) {
    throw createError({ statusCode: 400, statusMessage: 'propertyId, roomId, name, and checkIn are required' })
  }

  await requirePropertyPermission(event.context.user, propertyId, 'manage_tenants')

  const newTenant = await createTenant(event.context.user, propertyId, {
    roomId: body.roomId,
    name: body.name,
    phone: body.phone,
    provinceId: body.provinceId,
    regencyId: body.regencyId,
    districtId: body.districtId,
    checkIn: body.checkIn,
  })
  
  await logActivity({
    userId: event.context.user.id,
    actorName: event.context.user.name,
    actorRole: event.context.user.role,
    action: 'CHECKIN_TENANT',
    entityType: 'tenant',
    entityId: newTenant.id,
    details: { name: newTenant.name, propertyId, roomId: newTenant.roomId },
  })
  
  return apiSuccess(newTenant, 'Tenant created successfully')
})
