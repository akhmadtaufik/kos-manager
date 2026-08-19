import { z } from 'zod'
import { db } from '../../db'
import { expenses } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'
import { updateExpense } from '../../services/expense.service'
import { selectExpenseSchema } from '../../utils/schemaValidations'

defineRouteMeta({
  openAPI: {
    tags: ['Expenses'],
    summary: 'Update Expense Record',
    description: 'Modifies an existing operational expense record (e.g. category, amount, description, or date).'
  }
})

const updateExpenseSchema = z.object({
  category: z.string().min(1, 'Kategori tidak boleh kosong').optional(),
  amount: z.union([
    z.string().min(1, 'Nominal tidak boleh kosong'),
    z.number().positive('Nominal harus lebih dari 0')
  ]).optional(),
  description: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD').optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Expense ID is required' })
  }

  // Find existing expense to check property permissions
  const existing = await db.query.expenses.findFirst({
    where: eq(expenses.id, id)
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Pengeluaran tidak ditemukan' })
  }

  // Check user permission for the property
  await requirePropertyPermission(event.context.user, existing.propertyId, 'expenses:update')

  const body = await readBody(event)
  const parseResult = updateExpenseSchema.safeParse(body)
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Data tidak valid'
    throw createError({ statusCode: 400, statusMessage: firstError })
  }

  const updated = await updateExpense(id, parseResult.data, event.context.user.id)

  return apiSuccess(updated, 'Pengeluaran berhasil diperbarui')
})
