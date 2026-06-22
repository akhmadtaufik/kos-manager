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
      production: 'runtime'
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
    }
  },

  // TypeScript strict mode
  typescript: {
    strict: true,
  },
})
