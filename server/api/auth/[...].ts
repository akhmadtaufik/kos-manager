import { NuxtAuthHandler } from '#auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { db, users, accounts, sessions, verificationTokens } from '../../db'

const config = useRuntimeConfig()

export default NuxtAuthHandler({
  secret: config.authSecret,

  // Drizzle Adapter — persists sessions/accounts to PostgreSQL
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as any,

  providers: [
    // ===========================
    // Google OAuth Provider
    // ===========================
    GoogleProvider.default({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'pending' as const, // OAuth users default to pending
        }
      },
    }),

    // ===========================
    // Credentials Provider (Email + Password)
    // ===========================
    CredentialsProvider.default({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: { email?: string; password?: string } | undefined) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password wajib diisi.')
        }

        // Find user by email
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1)
          .then((rows) => rows[0])

        if (!user || !user.password) {
          throw new Error('Email atau password salah.')
        }

        // Verify password using bcrypt utility
        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Email atau password salah.')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    // Enrich JWT token with user role from DB
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === 'update' && session?.role) {
        token.role = session.role
      }
      
      // If user is logging in, OR if they are still pending (meaning they might have just completed onboarding)
      if (user || token.role === 'pending') {
        const emailToSearch = user?.email || token?.email
        if (emailToSearch) {
          const dbUser = await db
            .select({ role: users.role, id: users.id })
            .from(users)
            .where(eq(users.email, emailToSearch))
            .limit(1)
            .then((rows) => rows[0])

          if (dbUser) {
            token.role = dbUser.role
            token.userId = dbUser.id
          }
        }
      }
      return token
    },

    // Expose role and userId on the client-side session object
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.userId
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
