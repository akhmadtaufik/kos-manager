import { getPaymentsByProperty } from '../../services/payment.service'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyAccess } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined') {
    await requirePropertyAccess(user, propertyId)
    targetPropertyIds = [propertyId]
  } else {
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  const payments = await getPaymentsByProperty(targetPropertyIds)
  
  return apiSuccess(payments, 'Payments retrieved successfully')
})
