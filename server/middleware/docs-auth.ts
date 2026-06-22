import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  if ((url.pathname.startsWith('/docs') || url.pathname === '/_openapi.json') && !url.searchParams.has('debug')) {
    if (process.dev) {
      return
    }
    
    const session = await getServerSession(event)
    const user = session?.user
    
    if (!user || user.role !== 'owner') {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden: Docs access restricted to owners in production.' })
    }
  }
})
