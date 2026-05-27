import { getServerSession } from '#auth'

/**
 * Server middleware — validates auth session on all /api/* routes
 * EXCEPT the auth routes themselves.
 *
 * On every protected request it:
 *  1. Extracts the session (JWT) from the incoming request
 *  2. Returns 401 if no valid session is found
 *  3. Attaches user context to the event for downstream use
 */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  // Bypass auth for:
  //  - The Auth.js handler itself   (/api/auth/*)
  //  - The public register endpoint (/api/auth/register)
  if (url.pathname.startsWith('/api/auth')) {
    return
  }

  // Only intercept /api/* routes — let Nuxt pages pass through
  if (!url.pathname.startsWith('/api/')) {
    return
  }

  const session = await getServerSession(event)

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa.',
    })
  }

  // Attach session user to event context for use in API handlers
  event.context.user = session.user
})
