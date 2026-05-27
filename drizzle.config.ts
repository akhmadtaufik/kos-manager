import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  // Schema and relations files
  schema: [
    './server/db/schema.ts',
    './server/db/relations.ts',
  ],

  // Output directory for generated migrations
  out: './server/db/migrations',

  // Database dialect
  dialect: 'postgresql',

  // Database connection for drizzle-kit CLI (runs locally, NOT in Docker)
  // Uses DATABASE_MIGRATE_URL which points to localhost
  dbCredentials: {
    url: process.env.DATABASE_MIGRATE_URL || process.env.DATABASE_URL || '',
  },

  // Verbose logging during migration
  verbose: true,

  // Strict mode for safer migrations
  strict: true,
})
