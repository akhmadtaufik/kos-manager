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
      statusMessage: 'Forbidden: Hanya owner dan superadmin yang dapat membuat kategori pengeluaran baru'
    })
  }

  const body = await readBody(event)
  const name = (body.name || '').trim()
  const icon = (body.icon || 'PhTag').trim()
  const color = (body.color || 'bg-slate-700').trim()

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nama kategori wajib diisi'
    })
  }

  const [newCategory] = await db.insert(expenseCategories).values({
    userId: user.id,
    name,
    icon,
    color,
    isSystem: 0,
  }).returning()

  if (!newCategory) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat kategori baru' })
  }

  await logActivity({
    userId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'CREATE',
    entityType: 'expense_category',
    entityId: newCategory.id,
    details: { name: newCategory.name, icon: newCategory.icon },
  })

  return apiSuccess(newCategory, 'Kategori pengeluaran berhasil dibuat')
})
