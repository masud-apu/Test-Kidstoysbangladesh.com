'use client'

import { SessionProvider } from 'next-auth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Refetch on window focus for better UX (especially in Firefox)
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}
