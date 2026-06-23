export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('openapi:generate', (openapi) => {
    // Add global security schemes for cookie authentication
    openapi.components = openapi.components || {}
    openapi.components.securitySchemes = {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'Session cookie from NextAuth/NuxtAuth'
      }
    }
    
    // Add global standard error responses
    openapi.components.responses = {
      ValidationError: {
        description: 'Bad Request - Validation error or invalid payload',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
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
                success: { type: 'boolean', example: false },
                statusCode: { type: 'integer', example: 500 },
                message: { type: 'string', example: 'An unexpected internal error occurred.' }
              }
            }
          }
        }
      }
    }
    
    // Apply globally
    openapi.security = [{ cookieAuth: [] }]

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
