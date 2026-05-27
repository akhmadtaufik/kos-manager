import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import * as relations from './relations'

// Use runtime config for the database URL
const config = useRuntimeConfig()

let dbUrl = config.databaseUrl

// Auto-patch the database URL for local development outside of Docker
// On Linux, host.docker.internal does not resolve from the host machine.
if (process.env.NODE_ENV !== 'production') {
  dbUrl = dbUrl.replace('host.docker.internal', 'localhost')
}

// Create postgres-js connection
// connection is lazily created on first query
const queryClient = postgres(dbUrl, {
  max: 10,               // Connection pool size
  idle_timeout: 20,       // Close idle connections after 20 seconds
  connect_timeout: 10,    // Connection timeout in seconds
})

// Create Drizzle ORM instance with schema and relations
export const db = drizzle(queryClient, {
  schema: { ...schema, ...relations },
})

// Re-export all schema definitions for convenience
export * from './schema'
