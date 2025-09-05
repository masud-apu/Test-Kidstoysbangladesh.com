import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { users, sessions } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateProfileSchema = z.object({
  type: z.literal('profile'),
  username: z.string().min(3),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
})

const updatePasswordSchema = z.object({
  type: z.literal('password'),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const inputHash = await hashPassword(password)
  return inputHash === hashedPassword
}

async function getCurrentUser(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value

  if (!sessionId) {
    return null
  }

  const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)
  
  if (!session[0] || session[0].expiresAt < new Date()) {
    return null
  }

  const user = await db.select().from(users).where(eq(users.id, session[0].userId)).limit(1)
  return user[0] || null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return user data without password
    const { hashedPassword, ...userData } = user

    return NextResponse.json({
      user: userData
    })

  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Determine if this is a profile or password update
    if (body.type === 'profile') {
      const validatedData = updateProfileSchema.parse(body)

      // Check if username is already taken by another user
      if (validatedData.username !== user.username) {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.username, validatedData.username))
          .limit(1)

        if (existingUser[0] && existingUser[0].id !== user.id) {
          return NextResponse.json(
            { error: 'Username already taken' },
            { status: 400 }
          )
        }
      }

      // Update profile
      const [updatedUser] = await db
        .update(users)
        .set({
          username: validatedData.username,
          email: validatedData.email,
          phone: validatedData.phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning()

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }

      // Return updated user data without password
      const { hashedPassword, ...userData } = updatedUser

      return NextResponse.json({
        success: true,
        user: userData
      })

    } else if (body.type === 'password') {
      const validatedData = updatePasswordSchema.parse(body)

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(
        validatedData.currentPassword, 
        user.hashedPassword
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Hash new password
      const newHashedPassword = await hashPassword(validatedData.newPassword)

      // Update password
      const [updatedUser] = await db
        .update(users)
        .set({
          hashedPassword: newHashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning()

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid update type' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}