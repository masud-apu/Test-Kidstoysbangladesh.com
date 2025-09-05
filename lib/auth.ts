import { db } from './db'
import { users, sessions } from './schema'
import { eq } from 'drizzle-orm'

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':')
  
  // Use Web Crypto API for Edge Runtime compatibility
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
  const derivedHex = Array.from(derivedArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return hash === derivedHex
}

export async function authenticate(username: string, password: string) {
  const user = await db.select().from(users).where(eq(users.username, username)).limit(1)
  
  if (user.length === 0) {
    return null
  }

  const isValid = await verifyPassword(password, user[0].hashedPassword)
  if (!isValid) {
    return null
  }

  return user[0]
}

export async function createSession(userId: number) {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt
  })

  return sessionId
}

export async function getSession(sessionId: string) {
  const session = await db
    .select({
      id: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        username: users.username,
        role: users.role
      }
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  if (session.length === 0 || session[0].expiresAt < new Date()) {
    return null
  }

  return session[0]
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}