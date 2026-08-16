import { eq, or, isNull } from 'drizzle-orm'
import { db } from '../../../db'
import { expenseCategories } from '../../../db/schema'
import { apiSuccess } from '../../../utils/response'

export const DEFAULT_SYSTEM_CATEGORIES = [
  { id: 'sys-pln', name: 'Listrik & Daya (PLN)', icon: 'PhLightning', color: 'bg-amber-500', isSystem: 1 },
  { id: 'sys-pdam', name: 'Air Bersih & Sanitasi (PDAM)', icon: 'PhDrop', color: 'bg-blue-500', isSystem: 1 },
  { id: 'sys-sampah', name: 'Kebersihan & Iuran Sampah', icon: 'PhTrash', color: 'bg-emerald-500', isSystem: 1 },
  { id: 'sys-honor', name: 'Gaji & Honor Karyawan', icon: 'PhUserCheck', color: 'bg-violet-500', isSystem: 1 },
  { id: 'sys-pbb', name: 'Pajak Bumi & Bangunan (PBB)', icon: 'PhReceipt', color: 'bg-indigo-500', isSystem: 1 },
  { id: 'sys-zakat', name: 'Zakat & Infaq Usaha', icon: 'PhHandHeart', color: 'bg-teal-500', isSystem: 1 },
  { id: 'sys-yatim', name: 'Santunan & Donasi Sosial', icon: 'PhUsersThree', color: 'bg-pink-500', isSystem: 1 },
  { id: 'sys-renovasi', name: 'Pemeliharaan & Renovasi', icon: 'PhWrench', color: 'bg-rose-500', isSystem: 1 },
  { id: 'sys-komisi', name: 'Komisi & Marketing Agen', icon: 'PhCoins', color: 'bg-orange-500', isSystem: 1 },
]

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Fetch custom categories created by the user
  const customCategories = await db.query.expenseCategories.findMany({
    where: or(eq(expenseCategories.userId, user.id), isNull(expenseCategories.userId)),
    orderBy: (cat, { asc }) => [asc(cat.createdAt)],
  })

  // Combine system defaults with user custom categories
  const allCategories = [
    ...DEFAULT_SYSTEM_CATEGORIES,
    ...customCategories.filter(c => !DEFAULT_SYSTEM_CATEGORIES.some(d => d.name.toLowerCase() === c.name.toLowerCase()))
  ]

  return apiSuccess(allCategories, 'Categories retrieved successfully')
})
