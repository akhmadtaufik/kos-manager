import { setResponseStatus, createError } from 'h3'
import type { H3Event } from 'h3'

/**
 * Standardized API response wrapper
 * Ensures consistent response format across all endpoints
 */

export interface UniversalResponse<T = null> {
  status: 'success' | 'error'
  statusCode: number
  message: string
  data?: T
  errors?: unknown
}

/**
 * NEW: Strict JSON format for success responses
 */
export function sendSuccessResponse<T>(
  event: H3Event,
  data: T,
  statusCode = 200,
  message = 'Success'
): UniversalResponse<T> {
  setResponseStatus(event, statusCode)
  return {
    status: 'success',
    statusCode,
    message,
    ...(data !== undefined && data !== null && { data })
  }
}

/**
 * NEW: Strict JSON format for error responses
 */
export function sendErrorResponse(
  event: H3Event,
  statusCode: number,
  message: string,
  errors: unknown = null
): UniversalResponse {
  setResponseStatus(event, statusCode)
  return {
    status: 'error',
    statusCode,
    message,
    ...(errors !== undefined && errors !== null && { errors })
  }
}

// ==========================================
// LEGACY COMPATIBILITY LAYER
// These functions wrap the old arguments into the new strict format
// ensuring that existing endpoints (50+) do not break.
// ==========================================

export function apiSuccess<T>(data: T, message?: string) {
  // Returns the new format so that when returned from an endpoint, H3 automatically uses it.
  // Note: we can't set status code here easily without the event, but H3 defaults to 200.
  return {
    status: 'success',
    statusCode: 200,
    message: message || 'Success',
    ...(data !== undefined && data !== null && { data })
  }
}

export function apiError(
  event: H3Event,
  statusCode: number,
  message: string,
  details?: unknown
): never {
  // We throw an H3 error, but we embed our strict Universal format in the data.
  // The error-handler plugin must intercept this and output the strict JSON.
  throw createError({
    statusCode,
    statusMessage: message,
    data: {
      status: 'error',
      statusCode,
      message,
      ...(details !== undefined && details !== null && { errors: details }),
    },
  })
}

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
