// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4,
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'phantom-ui'
    }
  },

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@sidebase/nuxt-auth',
    '@nuxt/test-utils/module',
    '@scalar/nuxt',
  ],

  // Tailwind CSS configuration
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.ts',
  },

  // Runtime configuration (exposed to server only by default)
  runtimeConfig: {
    // Server-only keys (not exposed to client)
    authSecret: process.env.AUTH_SECRET || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    databaseUrl: process.env.DATABASE_URL || '',

    // Client-exposed keys
    public: {
      authOrigin: process.env.AUTH_ORIGIN || 'http://localhost:3000',
    },
  },

  experimental: {
    appManifest: false,
  },

  auth: {
    baseURL: process.env.AUTH_ORIGIN ? `${process.env.AUTH_ORIGIN}/api/auth` : 'http://localhost:3000/api/auth',
    originEnvKey: 'NONE',
    provider: {
      type: 'authjs',
      defaultProvider: 'credentials',
      addDefaultCallbackUrl: true,
      pages: {
        signIn: '/'
      }
    },
    globalAppMiddleware: {
      isEnabled: true,
    },
  },

  routeRules: {
    '/docs/**': { ssr: false },
    '/_openapi.json': { ssr: false },
  },

  nitro: {
    experimental: {
      openAPI: true
    },
    openAPI: {
      production: 'runtime',
      meta: {
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
        },
        security: [{ cookieAuth: [] }]
      }
    },
    // Automatically import server utilities
    imports: {
      dirs: ['server/utils'],
    },
  },

  scalar: {
    url: '/_openapi.json',
    pathRouting: {
      basePath: '/docs',
    },
    configuration: {
      authentication: {
        preferredSecurityScheme: 'cookieAuth'
      }
    }
  },

  // TypeScript strict mode
  typescript: {
    strict: true,
  },
})
