import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Please check your .env.local file.')
}

const pool = new Pool({ connectionString: DATABASE_URL })
export const db = drizzle(pool)