import { getExpensesByProperty } from '../../services/expense.service'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { selectExpenseSchema, insertExpenseSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Expenses'],
    summary: 'List All Expenses',
    description: 'Retrieves a list of all recorded operational expenses. Supports filtering by date range, category, and property.'
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

  const records = await getExpensesByProperty(targetPropertyIds)
  
  return apiSuccess(records, 'Expenses retrieved successfully')
})
