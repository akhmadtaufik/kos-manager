import { z } from 'zod'
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { 
  users, 
  properties, 
  rooms, 
  tenants, 
  payments, 
  expenses, 
  activityLogs 
} from '../db/schema'

// Base generic wrapper for pagination
export const createPaginatedSchema = (dataSchema: any) => {
  return z.object({
    data: z.array(dataSchema),
    meta: z.object({
      currentPage: z.number(),
      totalPages: z.number(),
      totalItems: z.number()
    })
  })
}

// Zod Schemas automatically generated from Drizzle ORM
export const selectUserSchema = createSelectSchema(users)
export const insertUserSchema = createInsertSchema(users)

export const selectPropertySchema = createSelectSchema(properties)
export const selectPropertyWithMetricsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
  totalRooms: z.coerce.number().int().default(0),
  occupiedRooms: z.coerce.number().int().default(0),
  permissions: z.array(z.string()).optional()
})
export const insertPropertySchema = createInsertSchema(properties)

export const selectRoomSchema = createSelectSchema(rooms)
export const insertRoomSchema = createInsertSchema(rooms)

export const selectTenantSchema = createSelectSchema(tenants)
export const insertTenantSchema = createInsertSchema(tenants)

export const selectPaymentSchema = createSelectSchema(payments)
export const insertPaymentSchema = createInsertSchema(payments)

export const selectExpenseSchema = createSelectSchema(expenses)
export const insertExpenseSchema = createInsertSchema(expenses)

export const selectActivityLogSchema = createSelectSchema(activityLogs)
export const insertActivityLogSchema = createInsertSchema(activityLogs)
