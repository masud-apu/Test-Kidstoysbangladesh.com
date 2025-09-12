'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePageTracking, usePagePerformance, useErrorTracking, useInteractionTracking, useScrollTracking } from '@/hooks/use-analytics'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // We'll handle this manually
    capture_pageleave: true,
    autocapture: true,
    debug: process.env.NODE_ENV === 'development',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('PostHog loaded successfully')
        posthog.debug()
      }
    }
  })
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
      <AnalyticsHooks />
      {children}
    </PostHogProvider>
  )
}