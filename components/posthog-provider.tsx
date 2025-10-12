'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { usePageTracking, usePagePerformance, useErrorTracking, useInteractionTracking, useScrollTracking } from '@/hooks/use-analytics'
import { Analytics } from '@/lib/analytics'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll handle this manually
    capture_pageleave: true,
    autocapture: true,
    debug: process.env.NODE_ENV === 'development',
    persistence: 'localStorage', // Use localStorage for persistence
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('PostHog loaded successfully')
        posthog.debug()
      }

      // Initialize or continue session
      const sessionInfo = Analytics.getSessionInfo()
      if (!sessionInfo.sessionId) {
        Analytics.initSession()
      } else {
        Analytics.incrementSessionPageCount()
      }

      // Set device properties for better user profiling
      const deviceInfo = Analytics.getDeviceInfo()
      posthog.register(deviceInfo)

      // Track anonymous ID for consistent tracking across sessions
      const anonymousId = Analytics.getOrCreateAnonymousId()
      posthog.register({ anonymous_id: anonymousId })

      // Re-identify user from localStorage ONLY if they were previously identified
      // This is safe because we're using alias() in the checkout form
      // PostHog will automatically merge anonymous + identified activities
      const storedUser = localStorage.getItem('posthog_identified_user')
      const storedProperties = localStorage.getItem('posthog_user_properties')
      if (storedUser && storedProperties) {
        try {
          const properties = JSON.parse(storedProperties)
          posthog.identify(storedUser, {
            ...properties,
            returning_user: true,
            last_seen: new Date().toISOString(),
          })
        } catch (e) {
          console.error('Failed to re-identify user:', e)
        }
      }
    }
  })

  // Track session end on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      Analytics.trackSessionEnd()
    })
  }
}

function AnalyticsHooks() {
  usePageTracking()
  usePagePerformance()
  useErrorTracking()
  useInteractionTracking()
  useScrollTracking()
  return null
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      {/* Wrap hooks that use usePathname/useSearchParams in Suspense */}
      <Suspense fallback={null}>
        <AnalyticsHooks />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
