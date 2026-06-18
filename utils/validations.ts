import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email format.'),
  password: z.string().min(1, 'Password is required.'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100),
  email: z.string().email('Invalid email format.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter.')
    .regex(/[0-9]/, 'Must contain at least 1 number.')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least 1 special character.'),
  role: z.enum(['superadmin', 'owner', 'operator', 'pending']).default('pending'),
})
