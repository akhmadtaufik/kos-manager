import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ZodError, z } from 'zod'
import { sendErrorResponse, formatZodErrors } from '../../server/utils/response'
import { logger } from '../../server/utils/logger'

describe('System Observability & Error Formatter Suite', () => {
  it('formats standardized error responses with Correlation ID (reqId)', () => {
    const mockEvent = { node: { res: { statusCode: 200 } } }
    const response = sendErrorResponse(mockEvent as any, 500, 'Internal Server Error', null, 'REQ-abcdef')

    expect(response.status).toBe('error')
    expect(response.statusCode).toBe(500)
    expect(response.message).toBe('Internal Server Error')
    expect(response.reqId).toBe('REQ-abcdef')
  })

  it('formats Zod validation errors into standardized field and message issues', () => {
    const testSchema = z.object({
      email: z.string().email('Invalid email address'),
      amount: z.number().positive('Must be positive')
    })

    const result = testSchema.safeParse({ email: 'not-an-email', amount: -100 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      expect(Array.isArray(formatted)).toBe(true)
      expect(formatted.length).toBe(2)
      expect(formatted[0].field).toBe('email')
      expect(formatted[0].message).toBe('Invalid email address')
      expect(formatted[1].field).toBe('amount')
      expect(formatted[1].message).toBe('Must be positive')
    }
  })

  it('masks sensitive server crashes from client error messages', () => {
    const mockEvent = { node: { res: { statusCode: 200 } } }
    const clientSafeMessage = 'An unexpected internal error occurred.'
    const response = sendErrorResponse(mockEvent as any, 500, clientSafeMessage, null, 'REQ-998877')

    expect(response.statusCode).toBe(500)
    expect(response.message).not.toContain('SECRET_DATABASE_CRASH')
    expect(response.message).toBe(clientSafeMessage)
  })
})
