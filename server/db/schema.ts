import {
  pgTable,
  text,
  timestamp,
  integer,
  varchar,
  decimal,
  jsonb,
  date,
  primaryKey,
  uuid,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ===========================
// Enums
// ===========================

export const userRoleEnum = pgEnum('user_role', ['superadmin', 'owner', 'operator', 'pending'])
export const roomStatusEnum = pgEnum('room_status', ['available', 'occupied'])
export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'unpaid', 'partial'])

// ===========================
// Auth.js / NextAuth Tables
// ===========================

/**
 * Users table — Auth.js compatible + KosManager extensions
 * Stores both OAuth and Credentials-based users
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  password: text('password'), // null for OAuth-only users
  role: userRoleEnum('role').notNull().default('pending'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('users_email_idx').on(table.email),
])

/**
 * OAuth Accounts — Auth.js Drizzle Adapter requirement
 */
export const accounts = pgTable('accounts', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => [
  primaryKey({ columns: [table.provider, table.providerAccountId] }),
])

/**
 * Sessions — Auth.js Drizzle Adapter requirement
 */
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

/**
 * Verification Tokens — Auth.js Drizzle Adapter requirement
 */
export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.identifier, table.token] }),
])

// ===========================
// Business Domain Tables
// ===========================

/**
 * Properties — Kos/boarding house branches
 * Owned by superadmin (userId)
 */
export const properties = pgTable('properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('properties_user_id_idx').on(table.userId),
])

/**
 * User-Properties junction table — RBAC mapping
 * Maps operators to specific properties they can access
 */
export const userProperties = pgTable('user_properties', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  permissions: jsonb('permissions').default(['manage_rooms', 'manage_tenants', 'manage_payments', 'manage_expenses', 'view_reports']),
  assignedAt: timestamp('assigned_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.propertyId] }),
])

/**
 * Rooms — Individual rooms within a property
 */
export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  roomNumber: varchar('room_number', { length: 50 }).notNull(),
  status: roomStatusEnum('status').notNull().default('available'),
  monthlyRate: decimal('monthly_rate', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('rooms_property_id_idx').on(table.propertyId),
  uniqueIndex('rooms_property_room_number_idx').on(table.propertyId, table.roomNumber),
])

/**
 * Tenants — Kos residents
 * provinceId and regencyId are STATIC string identifiers from external API
 * (no dynamic master table — per PRD requirement)
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  idCardUrl: text('id_card_url'),
  provinceId: varchar('province_id', { length: 10 }), // Static API identifier
  regencyId: varchar('regency_id', { length: 10 }),   // Static API identifier
  checkIn: date('check_in', { mode: 'date' }).notNull(),
  checkOut: date('check_out', { mode: 'date' }),
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('tenants_room_id_idx').on(table.roomId),
  index('tenants_province_id_idx').on(table.provinceId),
  index('tenants_regency_id_idx').on(table.regencyId),
])

/**
 * Payments — Invoice-based billing
 * additionalFees uses JSONB for dynamic line items:
 * e.g. [{ "name": "WiFi", "amount": 50000 }, { "name": "Laundry", "amount": 25000 }]
 */
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  billingMonth: varchar('billing_month', { length: 7 }).notNull(), // Format: "2025-01"
  baseRent: decimal('base_rent', { precision: 12, scale: 2 }).notNull(),
  additionalFees: jsonb('additional_fees').default([]), // JSONB array of { name, amount }
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('unpaid'),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('payments_tenant_id_idx').on(table.tenantId),
  index('payments_property_id_idx').on(table.propertyId),
  index('payments_billing_month_idx').on(table.billingMonth),
  uniqueIndex('payments_tenant_billing_idx').on(table.tenantId, table.billingMonth),
])

/**
 * Expenses — Operational costs per property
 */
export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  date: date('date', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('expenses_property_id_idx').on(table.propertyId),
  index('expenses_date_idx').on(table.date),
])

/**
 * Activity Logs — Audit trail for all CRUD operations
 * details column uses JSONB for flexible metadata storage
 */
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(), // e.g., 'CREATE', 'UPDATE', 'DELETE'
  entityType: varchar('entity_type', { length: 50 }).notNull(), // e.g., 'tenant', 'payment'
  entityId: uuid('entity_id'),
  details: jsonb('details'), // Flexible metadata: { before: {...}, after: {...} }
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => [
  index('activity_logs_user_id_idx').on(table.userId),
  index('activity_logs_entity_type_idx').on(table.entityType),
  index('activity_logs_created_at_idx').on(table.createdAt),
])

// ===========================
// Relations
// ===========================

export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  userProperties: many(userProperties),
}))

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  rooms: many(rooms),
  userProperties: many(userProperties),
  payments: many(payments),
  expenses: many(expenses),
}))

export const userPropertiesRelations = relations(userProperties, ({ one }) => ({
  user: one(users, {
    fields: [userProperties.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [userProperties.propertyId],
    references: [properties.id],
  }),
}))

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  tenants: many(tenants),
}))

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  room: one(rooms, {
    fields: [tenants.roomId],
    references: [rooms.id],
  }),
  payments: many(payments),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
  property: one(properties, {
    fields: [payments.propertyId],
    references: [properties.id],
  }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  property: one(properties, {
    fields: [expenses.propertyId],
    references: [properties.id],
  }),
}))
