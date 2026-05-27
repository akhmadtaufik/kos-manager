import { relations } from 'drizzle-orm'
import {
  users,
  accounts,
  sessions,
  properties,
  userProperties,
  rooms,
  tenants,
  payments,
  expenses,
  activityLogs,
} from './schema'

// ===========================
// Auth.js Relations
// ===========================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  ownedProperties: many(properties),
  userProperties: many(userProperties),
  activityLogs: many(activityLogs),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

// ===========================
// Business Domain Relations
// ===========================

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  userProperties: many(userProperties),
  rooms: many(rooms),
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

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}))
