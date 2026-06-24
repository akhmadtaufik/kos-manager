import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('System Observability & UX', async () => {
  await setup({
    server: true,
    setupTimeout: 300000
  })

  it('generates a Correlation ID (reqId) on 500 fatal errors', async () => {
    try {
      await $fetch('/api/auth/test-fatal')
      expect.fail('Expected a 500 error but request succeeded')
    } catch (err: any) {
      expect(err.statusCode).toBe(500)
      
      const responseBody = err.data
      
      expect(responseBody).toBeDefined()
      expect(responseBody.status).toBe('error')
      expect(responseBody.reqId).toBeDefined()
      
      // Check the format REQ-XXXXXX (6 hex characters)
      expect(responseBody.reqId).toMatch(/^REQ-[a-fA-F0-9]{6}$/)
    }
  })

  it('renders the custom error.vue HTML on non-existent frontend routes', async () => {
    let htmlText = '';
    try {
      await $fetch('/halaman-ngasal-123', {
        headers: {
          'Accept': 'text/html'
        }
      })
      expect.fail('Expected a 404 error but request succeeded')
    } catch (err: any) {
      expect(err.statusCode).toBe(404)
      htmlText = err.data || ''
    }

    expect(typeof htmlText).toBe('string')
    expect(htmlText).toContain('min-h-[100dvh]')
    expect(htmlText).toContain('bg-slate-50')
    expect(htmlText).toContain('Kembali ke Dashboard')
    expect(htmlText).toContain('Halaman tidak ditemukan')
  })
})
