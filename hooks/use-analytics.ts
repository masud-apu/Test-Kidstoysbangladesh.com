import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Analytics } from '@/lib/analytics'

// Hook for automatic page view tracking
export function usePageTracking(pageName?: string) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const page = pageName || pathname
    const searchQuery = searchParams.get('q')
    
    Analytics.trackPageView(page, {
      search_query: searchQuery,
      url_params: Object.fromEntries(searchParams.entries())
    })
  }, [pathname, searchParams, pageName])
}

// Hook for tracking page load performance
export function usePagePerformance(pageName?: string) {
  const pathname = usePathname()

  useEffect(() => {
    const page = pageName || pathname
    
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      
      if (loadTime > 0) {
        Analytics.trackPageLoad(loadTime, page)
      }

      // Track Web Vitals if available
      if ('web-vitals' in window) {
        // This would require installing web-vitals package
        // For now, we'll track basic performance metrics
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            Analytics.trackPageLoad(navigation.loadEventEnd - navigation.loadEventStart, page)
          }
        }, 0)
      }
    }
  }, [pathname, pageName])
}

// Hook for error boundary tracking
export function useErrorTracking() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      Analytics.trackError(new Error(event.message), 'global_error_handler')
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      Analytics.trackError(new Error(event.reason), 'unhandled_promise_rejection')
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
}

// Hook for tracking user interactions
export function useInteractionTracking() {
  useEffect(() => {
    const trackClicks = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Track button clicks
      if (target.tagName === 'BUTTON') {
        const buttonText = target.textContent || target.getAttribute('aria-label') || 'unknown'
        Analytics.trackButtonClick(buttonText, window.location.pathname)
      }
      
      // Track link clicks
      if (target.tagName === 'A') {
        const link = target as HTMLAnchorElement
        Analytics.trackLinkClick(
          link.textContent || link.getAttribute('aria-label') || 'unknown',
          link.href,
          window.location.pathname
        )
      }
    }

    document.addEventListener('click', trackClicks)
    return () => document.removeEventListener('click', trackClicks)
  }, [])
}

// Hook for scroll tracking
export function useScrollTracking() {
  useEffect(() => {
    let maxScroll = 0
    
    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      )
      
      if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
        maxScroll = scrollPercent
        Analytics.trackButtonClick(`scroll_${scrollPercent}`, window.location.pathname, {
          scroll_percentage: scrollPercent
        })
      }
    }

    window.addEventListener('scroll', trackScroll, { passive: true })
    return () => window.removeEventListener('scroll', trackScroll)
  }, [])
}