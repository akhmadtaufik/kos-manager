import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    include: ['tests/**/*.test.ts'],
    hookTimeout: 300000,
    testTimeout: 300000,
    alias: {
      'bun:test': 'vitest',
      'magic-string': 'magic-string/dist/magic-string.cjs.js'
    }
  }
})
