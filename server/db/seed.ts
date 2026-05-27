import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './schema.js'
import bcrypt from 'bcrypt'
import { config } from 'dotenv'

config()

async function seed() {
  const dbUrl = process.env.DATABASE_URL!.replace('host.docker.internal', 'localhost')
  const queryClient = postgres(dbUrl)
  const db = drizzle(queryClient)

  console.log('Seeding backup superadmin user...')
  
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  try {
    await db.insert(users).values({
      name: 'Super Admin',
      email: 'admin@kosmanager.com',
      password: hashedPassword,
      role: 'superadmin',
      emailVerified: new Date()
    }).onConflictDoNothing()
    console.log('Seed completed successfully! (admin@kosmanager.com / admin123)')
  } catch (e) {
    console.error('Seed failed:', e)
  }
  
  process.exit(0)
}

seed()
