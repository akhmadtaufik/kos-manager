import { getExpensesByProperty } from '../../services/expense.service'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectExpenseSchema, insertExpenseSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['Expenses'],
    summary: 'List All Expenses',
    description: 'Retrieves a list of all recorded operational expenses. Supports filtering by date range, category, and property.',
    responses: {
      200: {
        description: 'Successful retrieval of data',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: createPaginatedSchema(selectExpenseSchema) })) } }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
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
