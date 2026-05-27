// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4,
  },

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@sidebase/nuxt-auth',
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
    },
    globalAppMiddleware: {
      isEnabled: true,
    },
  },


  // Nitro server configuration
  nitro: {
    // Automatically import server utilities
    imports: {
      dirs: ['server/utils'],
    },
  },

  // TypeScript strict mode
  typescript: {
    strict: true,
  },
})
