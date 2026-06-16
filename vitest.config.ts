import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    globals: true,
    setupFiles: [],
    include: ['tests/**/*.test.ts'],
    hookTimeout: 60000,
    testTimeout: 60000
  }
})
