import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { apiSuccess } from '../../utils/response'

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
