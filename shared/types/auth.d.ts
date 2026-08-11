import type { DefaultSession } from 'next-auth'

/**
 * Extends the default NextAuth session types to include
 * KosManager-specific fields: role and id.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'superadmin' | 'operator'
    } & DefaultSession['user']
  }

  interface JWT {
    userId?: string
    role?: 'superadmin' | 'operator'
  }
}
