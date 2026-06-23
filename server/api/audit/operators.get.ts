import { db } from '../../db'
import { properties, userProperties, users } from '../../db/schema'
import { eq, inArray } from 'drizzle-orm'
import { getServerSession } from '#auth'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectActivityLogSchema, insertActivityLogSchema, createPaginatedSchema } from '../../utils/validations'


import { sendSuccessResponse } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Audit'],
    summary: 'Get Operator Activity',
    description: 'Fetches activity logs specifically filtered for operators/staff, showing their administrative actions within the system.',
    responses: {
      200: {
        description: 'Successful retrieval of data',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: createPaginatedSchema(selectActivityLogSchema) })) } }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
})
export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userRole = (session.user as any).role
  const userId = (session.user as any).id

  if (userRole === 'operator') {
    // Operators only see themselves
    const op = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, name: true, role: true }
    })
    return sendSuccessResponse(event, { data: op ? [op] : [] })
  }

  if (userRole === 'owner') {
    // Owners see all operators associated with their properties
    const ownerProperties = await db.select({ id: properties.id }).from(properties).where(eq(properties.userId, userId))
    const propertyIds = ownerProperties.map(p => p.id)
    
    if (propertyIds.length === 0) {
      return sendSuccessResponse(event, { data: [] })
    }

    const assignments = await db.select({ userId: userProperties.userId })
      .from(userProperties)
      .where(inArray(userProperties.propertyId, propertyIds))
    
    const operatorIds = [...new Set(assignments.map(a => a.userId))]

    if (operatorIds.length === 0) {
      return sendSuccessResponse(event, { data: [] })
    }

    const ops = await db.query.users.findMany({
      where: inArray(users.id, operatorIds),
      columns: { id: true, name: true, role: true }
    })

    return sendSuccessResponse(event, { data: ops })
  }

  return sendSuccessResponse(event, { data: [] })
})
