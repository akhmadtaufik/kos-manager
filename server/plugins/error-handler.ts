import { logger } from '../utils/logger'
import { ZodError } from 'zod'
import { sendErrorResponse } from '../utils/response'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', async (error: any, { event }) => {
    // 1. Log the EXACT unmasked error with stack trace and URL
    logger.error({
      err: error,
      req: {
        method: event?.method,
        url: event?.path,
      }
    }, 'An error occurred during request processing')

    if (!event || event.handled) return

    // 2. Format response for Zod Validation Errors
    let isValidationError = false;
    let formattedIssues: any[] = [];

    if (error instanceof ZodError) {
      isValidationError = true;
      formattedIssues = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
    } else if (error.statusCode === 400 && (error.data?.issues || error.data?.zodError)) {
      isValidationError = true;
      const issues = error.data?.issues || error.data?.zodError?.issues || [];
      formattedIssues = issues.map((issue: any) => ({
        field: issue.path?.join('.') || 'unknown',
        message: issue.message
      }));
    } else if (error.name === 'ZodError') {
      isValidationError = true;
      formattedIssues = (error.issues || []).map((issue: any) => ({
        field: issue.path?.join('.') || 'unknown',
        message: issue.message
      }));
    }

    if (isValidationError) {
      const response = sendErrorResponse(event, 400, 'Validation failed', formattedIssues)
      setResponseHeader(event, 'Content-Type', 'application/json')
      await send(event, JSON.stringify(response))
      return
    }

    // 3. Handle known H3 errors (e.g., 401, 403, 404)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      // If the error was created with `apiError` or `HttpError`, it might already have the strict structure
      const details = error.data?.errors || error.data?.details || null;
      const response = sendErrorResponse(event, error.statusCode, error.statusMessage || error.message || 'Error', details)
      setResponseHeader(event, 'Content-Type', 'application/json')
      await send(event, JSON.stringify(response))
      return
    }

    // 4. Mask generic/Drizzle errors for production safety (500 Internal Server Error)
    const response = sendErrorResponse(event, 500, 'An unexpected internal error occurred.')
    setResponseHeader(event, 'Content-Type', 'application/json')
    await send(event, JSON.stringify(response))
  })
})
