import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { apiSuccess } from '../../utils/response'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { selectUserSchema, insertUserSchema, createPaginatedSchema } from '../../utils/validations'


defineRouteMeta({
  openAPI: {
    tags: ['User'],
    summary: 'Assign User Role',
    description: 'Updates or assigns specific roles and permissions to a user (e.g., promoting a staff member to manager).',
    responses: {
      201: {
        description: 'Resource successfully created',
        content: { 'application/json': { schema: zodToJsonSchema(z.object({ status: z.literal('success'), statusCode: z.literal(200), message: z.string().default('Success'), data: selectUserSchema })) } }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    }
  }
})
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Only allow updating if they are currently pending
  if (user.role !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Role has already been set' })
  }

  const body = await readBody(event)
  if (body.role !== 'owner' && body.role !== 'operator') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role selection' })
  }

  await db.update(users).set({ role: body.role }).where(eq(users.id, user.id))

  return apiSuccess(null, `Role successfully set to ${body.role}`)
})
