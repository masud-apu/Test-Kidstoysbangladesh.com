import { NextRequest, NextResponse } from 'next/server'
import { authenticate, createSession, deleteSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url)
  
  if (pathname === '/api/auth/login') {
    try {
      const { username, password } = await request.json()
      
      const user = await authenticate(username, password)
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const sessionId = await createSession(user.id)
      
      const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role } })
      
      const cookieStore = await cookies()
      cookieStore.set('session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })

      return response
    } catch (error) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
  }

  if (pathname === '/api/auth/logout') {
    try {
      const cookieStore = await cookies()
      const sessionId = cookieStore.get('session')?.value
      
      if (sessionId) {
        await deleteSession(sessionId)
      }
      
      const response = NextResponse.json({ success: true })
      cookieStore.delete('session')
      
      return response
    } catch (error) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}