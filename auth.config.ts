import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Redirect to signin page on error instead of default error page
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAccount = nextUrl.pathname.startsWith('/account')

      if (isOnAccount) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      console.log('[JWT Callback] Called with:', {
        hasUser: !!user,
        trigger,
        tokenKeys: Object.keys(token),
        userId: token.id,
        userPhone: token.phone
      })

      // Initial sign in
      if (user) {
        console.log('[JWT Callback] Initial sign in - setting token data:', {
          id: user.id,
          phone: user.phone,
          hasSessionToken: !!user.sessionToken
        })
        token.id = user.id
        token.phone = user.phone
        token.sessionToken = user.sessionToken
        token.name = user.name
        token.email = user.email
      }

      // Handle session update
      if (trigger === 'update' && session) {
        console.log('[JWT Callback] Update trigger - updating token')
        token.name = session.name
        token.email = session.email
      }

      console.log('[JWT Callback] Returning token with keys:', Object.keys(token))
      return token
    },
    async session({ session, token }) {
      console.log('[Session Callback] Called with:', {
        hasSession: !!session,
        hasUser: !!session.user,
        tokenKeys: Object.keys(token),
        tokenId: token.id,
        tokenPhone: token.phone
      })

      if (token && session.user) {
        session.user.id = token.id as string
        session.user.phone = token.phone as string
        session.user.sessionToken = token.sessionToken as string
        if (token.name) session.user.name = token.name as string
        if (token.email) session.user.email = token.email as string

        console.log('[Session Callback] Returning session with user:', {
          id: session.user.id,
          phone: session.user.phone,
          name: session.user.name
        })
      }

      return session
    },
  },
  providers: [], // Providers will be added in auth.ts
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  // Fix for Firefox - explicitly configure cookies with proper settings
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // Firefox requires explicit sameSite
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: undefined, // Don't set domain in development
      },
    },
  },
  // Use base path to ensure cookies work correctly
  basePath: '/api/auth',
  debug: true, // Enable debug mode to see what's happening
} satisfies NextAuthConfig
