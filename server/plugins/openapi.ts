export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('openapi:generate', (openapi) => {
    if (openapi.paths) {
      for (const path in openapi.paths) {
        if (path === '' || path === '/' || path.startsWith('/_') || path.startsWith('/api/auth/')) {
          // You might not want to hide all auth routes, but typically internal nuxt auth shouldn't be exposed
          // Wait, the user might want to expose their own /api/auth/register
          // Let's only remove /_ routes and empty routes
        }
        
        // Let's just remove Nuxt internals
        if (path === '' || path === '/' || path.startsWith('/_')) {
          delete openapi.paths[path]
        }
      }
    }
  })
})
