import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import { users } from '../lib/schema'
import { eq } from 'drizzle-orm'
import { webcrypto } from 'node:crypto'
import * as fs from 'fs'
import * as path from 'path'

// Use Node.js Web Crypto API
const crypto = webcrypto as Crypto

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envLines = envContent.split('\n')
  envLines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=').replace(/^["']|["']$/g, '')
      if (key && value) {
        process.env[key] = value
      }
    }
  })
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })
const db = drizzle(pool)

async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const saltArray = new Uint8Array(16)
  crypto.getRandomValues(saltArray)
  const salt = Array.from(saltArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  // Use Web Crypto API for consistency with auth.ts
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    64 * 8 // 64 bytes = 512 bits
  )
  
  const derivedArray = new Uint8Array(derivedBits)
  const hash = Array.from(derivedArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return `${salt}:${hash}`
}

async function resetAdmin() {
  try {
    const adminUsername = 'admin'
    const adminPassword = 'Admin12345&'

    // Delete existing admin user
    await db.delete(users).where(eq(users.username, adminUsername))
    console.log('🗑️ Deleted existing admin user')

    // Hash the password
    const hashedPassword = await hashPassword(adminPassword)

    // Create admin user
    const [newAdmin] = await db.insert(users).values({
      username: adminUsername,
      hashedPassword,
      role: 'admin'
    }).returning()

    console.log('✅ Admin user recreated successfully!')
    console.log(`Username: ${adminUsername}`)
    console.log(`Password: ${adminPassword}`)
    console.log(`User ID: ${newAdmin.id}`)
    
  } catch (error) {
    console.error('❌ Error resetting admin user:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

resetAdmin()