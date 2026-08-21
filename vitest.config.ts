import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './'),
      '@': path.resolve(__dirname, './'),
      '#imports': path.resolve(__dirname, './tests/mocks/nitro-imports.ts')
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/api/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    testTimeout: 30000
  }
})
