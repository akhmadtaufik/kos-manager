import { defineNitroPlugin } from 'nitropack/runtime'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { z } from 'zod'
import { 
  selectPropertySchema, selectRoomSchema, selectTenantSchema, 
  selectPaymentSchema, selectExpenseSchema, selectUserSchema, 
  selectActivityLogSchema, createPaginatedSchema 
} from '../utils/validations'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('openapi:generate', (config) => {
    config.components = config.components || {}
    config.components.schemas = config.components.schemas || {}

    const wrapSuccess = (dataSchema: z.ZodTypeAny) => z.object({
      status: z.literal('success'),
      statusCode: z.number().default(200),
      message: z.string().default('Success'),
      data: dataSchema
    })

    // 1. REGISTER GLOBAL SCHEMAS (Strictly with { target: 'openApi3' })
    const schemas = {
      PropertyListResponse: wrapSuccess(createPaginatedSchema(selectPropertySchema)),
      PropertyResponse: wrapSuccess(selectPropertySchema),
      RoomListResponse: wrapSuccess(createPaginatedSchema(selectRoomSchema)),
      RoomResponse: wrapSuccess(selectRoomSchema),
      TenantListResponse: wrapSuccess(createPaginatedSchema(selectTenantSchema)),
      TenantResponse: wrapSuccess(selectTenantSchema),
      PaymentListResponse: wrapSuccess(createPaginatedSchema(selectPaymentSchema)),
      PaymentResponse: wrapSuccess(selectPaymentSchema),
      ExpenseListResponse: wrapSuccess(createPaginatedSchema(selectExpenseSchema)),
      ExpenseResponse: wrapSuccess(selectExpenseSchema),
      StaffListResponse: wrapSuccess(createPaginatedSchema(selectUserSchema)),
      StaffResponse: wrapSuccess(selectUserSchema),
      AuditLogListResponse: wrapSuccess(createPaginatedSchema(selectActivityLogSchema)),
      AuditLogResponse: wrapSuccess(selectActivityLogSchema),
      ReportRekapResponse: wrapSuccess(z.object({
        totalRooms: z.number(),
        occupiedRooms: z.number(),
        revenue: z.number(),
        expenses: z.number(),
        netProfit: z.number(),
        month: z.string()
      })),
      AnalyticsDemographicsResponse: wrapSuccess(z.array(z.object({
        provinceId: z.string(),
        total: z.number()
      }))),
      SuccessResponse: z.object({
        status: z.literal('success'),
        statusCode: z.number().default(200),
        message: z.string().default('Success')
      })
    }

    for (const [name, schema] of Object.entries(schemas)) {
      config.components.schemas[name] = zodToJsonSchema(schema, { target: 'openApi3' })
    }

    // Add global standard error responses
    config.components.responses = config.components.responses || {}
    config.components.responses.ValidationError = {
      description: 'Bad Request - Validation error or invalid payload',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              statusCode: { type: 'integer', example: 400 },
              message: { type: 'string', example: 'Validation failed' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string', example: 'email' },
                    message: { type: 'string', example: 'Invalid format' }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    config.components.responses.UnauthorizedError = {
      description: 'Unauthorized Error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              statusCode: { type: 'integer', example: 401 },
              message: { type: 'string', example: 'Unauthorized.' }
            }
          }
        }
      }
    }

    config.components.responses.InternalServerError = {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              statusCode: { type: 'integer', example: 500 },
              message: { type: 'string', example: 'An unexpected internal error occurred.' }
            }
          }
        }
      }
    }

    config.components.responses.NotFoundError = {
      description: 'Not Found Error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              statusCode: { type: 'integer', example: 404 },
              message: { type: 'string', example: 'Resource not found.' }
            }
          }
        }
      }
    }

    // Apply globally
    config.security = [{ cookieAuth: [] }]

    if (config.paths) {
      for (const path in config.paths) {
        // Remove Nuxt internals
        if (path === '' || path === '/' || path.startsWith('/_')) {
          delete config.paths[path]
        }
      }
    }

    // 2. BYPASS AST STRIPPING: FORCE INJECT $REF INTO PATHS AT RUNTIME
    const routeMapping: Record<string, Record<string, string>> = {
      '/api/analytics/demographics': { get: 'AnalyticsDemographicsResponse' },
      '/api/audit': { get: 'AuditLogListResponse' },
      '/api/audit/operators': { get: 'AuditLogListResponse' },
      '/api/auth/register': { post: 'StaffResponse' },
      '/api/expenses': { get: 'ExpenseListResponse', post: 'ExpenseResponse' },
      '/api/expenses/{id}': { delete: 'SuccessResponse' },
      '/api/payments': { get: 'PaymentListResponse' },
      '/api/payments/{id}': { patch: 'PaymentResponse' },
      '/api/payments/generate': { post: 'PaymentResponse' },
      '/api/properties': { get: 'PropertyListResponse', post: 'PropertyResponse' },
      '/api/properties/{id}': { patch: 'PropertyResponse', delete: 'SuccessResponse' },
      '/api/reports/rekap': { get: 'ReportRekapResponse' },
      '/api/rooms': { get: 'RoomListResponse', post: 'RoomResponse' },
      '/api/rooms/{id}': { patch: 'RoomResponse', delete: 'SuccessResponse' },
      '/api/staff': { get: 'StaffListResponse', post: 'StaffResponse' },
      '/api/staff/{userId}': { patch: 'StaffResponse', delete: 'SuccessResponse' },
      '/api/tenants': { get: 'TenantListResponse', post: 'TenantResponse' },
      '/api/tenants/{id}': { patch: 'TenantResponse', delete: 'SuccessResponse' },
      '/api/user/role': { post: 'StaffResponse' }
    };

    for (const [path, methods] of Object.entries(routeMapping)) {
      if (config.paths && config.paths[path]) {
        for (const [method, schemaName] of Object.entries(methods)) {
          if (config.paths[path][method]) {
            config.paths[path][method].responses = config.paths[path][method].responses || {};
            config.paths[path][method].responses['200'] = {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schemaName}` }
                }
              }
            };
            config.paths[path][method].responses['400'] = { $ref: '#/components/responses/ValidationError' };
            config.paths[path][method].responses['401'] = { $ref: '#/components/responses/UnauthorizedError' };
            config.paths[path][method].responses['404'] = { $ref: '#/components/responses/NotFoundError' };
            config.paths[path][method].responses['500'] = { $ref: '#/components/responses/InternalServerError' };
          }
        }
      }
    }
  })
})
