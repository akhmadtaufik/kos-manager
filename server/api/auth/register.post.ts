import { eq } from 'drizzle-orm'
import { db, users } from '../../db'
import { registerSchema } from '../../../utils/validations'

export default defineEventHandler(async (event) => {
  // Parse and validate body
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validasi gagal',
      data: {
        success: false,
        error: 'Validasi gagal',
        details: parsed.error.flatten().fieldErrors,
      },
    })
  }

  const { name, email, password, role } = parsed.data

  // Check for duplicate email
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((rows) => rows[0])

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email sudah terdaftar',
      data: { success: false, error: 'Email sudah terdaftar' },
    })
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Insert new user
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      role,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })

  setResponseStatus(event, 201)
  return apiSuccess(newUser, 'Akun berhasil dibuat.')
})
