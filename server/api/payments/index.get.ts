import { getPaymentsByProperty } from '../../services/payment.service'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { selectPaymentSchema, insertPaymentSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Payments'],
    summary: 'List All Payments',
    description: 'Retrieves a list of all payment transactions, allowing filtering by status, date, and tenant.'
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

  const payments = await getPaymentsByProperty(targetPropertyIds)
  
  return apiSuccess(payments, 'Payments retrieved successfully')
})
