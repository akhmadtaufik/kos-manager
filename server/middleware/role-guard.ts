export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const user = event.context.user as any

  if (!user) return // Let auth.ts handle unauthenticated

  // Strict role guard for Operators
  if (user.role === 'operator') {
    // 1. Block ANY request to /api/staff
    if (url.pathname.startsWith('/api/staff')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Operators cannot access staff APIs'
      })
    }

    // 2. Block mutation requests to /api/properties (POST, PATCH, DELETE)
    // Operators are allowed to GET /api/properties to populate the property switcher
    if (url.pathname.startsWith('/api/properties') && event.method !== 'GET') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Operators cannot mutate properties'
      })
    }
  }
})
