import { eq } from 'drizzle-orm'
import { db, users } from '../../db'
import { registerSchema } from '../../../utils/validations'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'

defineRouteMeta({
  openAPI: {
    tags: ['Auth'],
    summary: 'Register New User',
    description: 'Registers a new user account in the system. Requires valid email, password, and basic user information.',
    responses: {
      201: {
        description: 'Resource successfully created',
        content: {
          'application/json': {
            schema: zodToJsonSchema(z.object({
              status: z.literal('success'),
              statusCode: z.literal(201),
              message: z.string().default('User successfully registered'),
              data: z.object({
                id: z.string(),
                email: z.string(),
                name: z.string(),
                role: z.string()
              })
            }))
          }
        }
      },
      400: { $ref: '#/components/responses/ValidationError' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      500: { $ref: '#/components/responses/InternalServerError' }
    },
    $global: {
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'next-auth.session-token',
            description: 'Session cookie from NextAuth/NuxtAuth'
          }
        },
        responses: {
          SuccessResponse: {
            description: 'Standard Success Response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    statusCode: { type: 'integer', example: 200 },
                    message: { type: 'string', example: 'Success' },
                    data: { type: 'object', description: 'Response payload' }
                  }
                }
              }
            }
          },
          ValidationError: {
            description: 'Bad Request - Validation error or invalid payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    statusCode: { type: 'integer', example: 400 },
                    message: { type: 'string', example: 'Validation failed' },
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string', example: 'email' },
                          message: { type: 'string', example: 'Invalid format' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          InternalServerError: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    statusCode: { type: 'integer', example: 500 },
                    message: { type: 'string', example: 'An unexpected internal error occurred.' }
                  }
                }
              }
            }
          },
          UnauthorizedError: {
            description: 'Unauthorized - Missing or invalid token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    statusCode: { type: 'integer', example: 401 },
                    message: { type: 'string', example: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa.' }
                  }
                }
              }
            }
          },
          NotFoundError: {
            description: 'Resource Not Found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'error' },
                    statusCode: { type: 'integer', example: 404 },
                    message: { type: 'string', example: 'Page not found' }
                  }
                }
              }
            }
          }
        }
      },
      security: [{ cookieAuth: [] }]
    }
  }
})
export default defineEventHandler(async (event) => {
  // Parse and validate body
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validasi gagal',
      data: {
        errors: parsed.error.flatten().fieldErrors,
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

  return sendSuccessResponse(event, newUser, 201, 'Akun berhasil dibuat.')
})
