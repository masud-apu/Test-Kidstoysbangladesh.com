import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, public files, and login page
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/admin/login'
  ) {
    return NextResponse.next()
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const sessionId = request.cookies.get('session')?.value

    if (!sessionId) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const session = await getSession(sessionId)
      
      if (!session || session.expiresAt < new Date()) {
        const response = NextResponse.redirect(new URL('/admin/login', request.url))
        response.cookies.delete('session')
        return response
      }

      // Add user info to headers for use in components
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', session.user.id.toString())
      requestHeaders.set('x-user-username', session.user.username)
      requestHeaders.set('x-user-role', session.user.role)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('Session validation error:', error)
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}