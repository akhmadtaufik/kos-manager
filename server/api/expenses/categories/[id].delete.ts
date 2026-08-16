import { eq, and } from 'drizzle-orm'
import { db } from '../../../db'
import { expenseCategories } from '../../../db/schema'
import { apiSuccess } from '../../../utils/response'
import { logActivity } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (user.role !== 'superadmin' && user.role !== 'owner') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Hanya owner dan superadmin yang dapat menghapus kategori'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id || id.startsWith('sys-')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kategori bawaan sistem tidak dapat dihapus'
    })
  }

  const category = await db.query.expenseCategories.findFirst({
    where: eq(expenseCategories.id, id),
  })

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan' })
  }

  if (category.isSystem === 1) {
    throw createError({ statusCode: 400, statusMessage: 'Kategori bawaan sistem tidak dapat dihapus' })
  }

  if (user.role !== 'superadmin' && category.userId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Anda tidak memiliki akses untuk menghapus kategori ini' })
  }

  await db.delete(expenseCategories).where(eq(expenseCategories.id, id))

  await logActivity({
    userId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'DELETE',
    entityType: 'expense_category',
    entityId: id,
    details: { name: category.name },
  })

  return apiSuccess({ id }, 'Kategori berhasil dihapus')
})
