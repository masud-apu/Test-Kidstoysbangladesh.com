'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { UserAccountDropdown } from '@/components/auth/user-account-dropdown'
import { PhoneAuthDialog } from '@/components/auth/phone-auth-dialog'
import { User, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderAuthProps {
  isScrolled: boolean
}

export function HeaderAuth({ isScrolled }: HeaderAuthProps) {
  const { data: session, status, update } = useSession()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Robust authentication check
  useEffect(() => {
    // Check multiple indicators of authentication
    const checkAuth = () => {
      const hasSession = status === 'authenticated'
      const hasUser = !!session?.user
      const hasPhone = !!session?.user?.phone

      console.log('[HeaderAuth] Auth check:', {
        status,
        hasSession,
        hasUser,
        hasPhone,
        user: session?.user
      })

      // Consider authenticated if status is 'authenticated' AND we have user data
      setIsAuthenticated(hasSession && hasUser && hasPhone)
    }

    checkAuth()
  }, [status, session])

  // Force session update on component mount (helps with Firefox cache issues)
  useEffect(() => {
    if (status !== 'loading') {
      update()
    }
  }, [])

  // Debug logging
  console.log('[HeaderAuth] Session status:', status)
  console.log('[HeaderAuth] Is authenticated:', isAuthenticated)

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <Button
        variant="ghost"
        disabled
        className={cn(
          'rounded-xl border border-gray-200 bg-white text-gray-700 flex items-center justify-center transition-all duration-500 ease-out',
          isScrolled ? 'w-10 h-10' : 'w-10 h-10'
        )}
      >
        <User className="h-5 w-5 animate-pulse" />
      </Button>
    )
  }

  // If authenticated, show user dropdown
  if (isAuthenticated && session?.user) {
    return (
      <UserAccountDropdown user={{
        name: session.user.name ?? null,
        phone: session.user.phone,
        email: session.user.email ?? null,
      }} />
    )
  }

  // If not authenticated, show sign-in button
  return (
    <>
      {/* Desktop: Show "Sign In" button with text */}
      <Button
        onClick={() => setShowAuthDialog(true)}
        className={cn(
          'hidden md:flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-500 ease-out',
          isScrolled ? 'h-10 px-4 text-sm' : 'h-10 px-4'
        )}
      >
        <LogIn className="h-4 w-4" />
        <span>Sign In</span>
      </Button>

      {/* Mobile: Show icon-only button */}
      <Button
        onClick={() => setShowAuthDialog(true)}
        aria-label="Sign In"
        className={cn(
          'md:hidden rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center transition-all duration-500 ease-out',
          isScrolled ? 'w-10 h-10' : 'w-10 h-10'
        )}
      >
        <User className="h-5 w-5" />
      </Button>

      {/* Auth Dialog */}
      <PhoneAuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        callbackUrl="/"
      />
    </>
  )
}
