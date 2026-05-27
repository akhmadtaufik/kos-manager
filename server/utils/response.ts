import type { H3Event } from 'h3'

/**
 * Standardized API response wrapper
 * Ensures consistent response format across all endpoints
 */

interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

interface ApiErrorResponse {
  success: false
  error: string
  statusCode: number
  details?: unknown
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}

/**
 * Create a standardized error response and throw an H3 error
 */
export function apiError(
  event: H3Event,
  statusCode: number,
  message: string,
  details?: unknown
): never {
  throw createError({
    statusCode,
    statusMessage: message,
    data: {
      success: false,
      error: message,
      statusCode,
      ...(details && { details }),
    },
  })
}

/**
 * Shorthand for common HTTP errors
 */
export const HttpError = {
  badRequest: (event: H3Event, message = 'Bad Request', details?: unknown) =>
    apiError(event, 400, message, details),

  unauthorized: (event: H3Event, message = 'Unauthorized') =>
    apiError(event, 401, message),

  forbidden: (event: H3Event, message = 'Forbidden') =>
    apiError(event, 403, message),

  notFound: (event: H3Event, message = 'Not Found') =>
    apiError(event, 404, message),

  conflict: (event: H3Event, message = 'Conflict') =>
    apiError(event, 409, message),

  internal: (event: H3Event, message = 'Internal Server Error') =>
    apiError(event, 500, message),
}
