'use client'

import { usePostHog } from 'posthog-js/react'
import { useState, useEffect } from 'react'

export default function PostHogTestPage() {
  const posthog = usePostHog()
  const [eventsSent, setEventsSent] = useState(0)

  useEffect(() => {
    // Send an initial test event when page loads
    if (posthog) {
      posthog.capture('test_page_loaded', {
        page: 'posthog-test',
        timestamp: new Date().toISOString(),
        initial_load: true
      })
      console.log('Initial test event sent on page load!')
    }
  }, [posthog])

  const sendTestEvent = () => {
    posthog?.capture('test_event_manual', {
      test_property: 'This is a manual test',
      timestamp: new Date().toISOString(),
      page: 'test_page',
      event_number: eventsSent + 1
    })
    setEventsSent(prev => prev + 1)
    console.log('Test event sent to PostHog')
  }

  const sendPageView = () => {
    posthog?.capture('$pageview', {
      $current_url: window.location.href,
      test_pageview: true
    })
    setEventsSent(prev => prev + 1)
    console.log('Pageview event sent to PostHog')
  }

  const identifyUser = () => {
    const testUserId = `test_user_${Date.now()}`
    posthog?.identify(testUserId, {
      email: 'test@example.com',
      name: 'Test User',
      created_at: new Date().toISOString()
    })
    setEventsSent(prev => prev + 1)
    console.log(`User identified: ${testUserId}`)
  }

  const sendButtonClick = () => {
    posthog?.capture('button_clicked', {
      button_name: 'test_button',
      button_action: 'manual_test',
      clicked_at: new Date().toISOString()
    })
    setEventsSent(prev => prev + 1)
    console.log('Button click event sent to PostHog')
  }

  const sendAddToCart = () => {
    posthog?.capture('add_to_cart', {
      product_id: 'test_product_123',
      product_name: 'Test Toy',
      price: 999,
      currency: 'BDT',
      quantity: 1
    })
    setEventsSent(prev => prev + 1)
    console.log('Add to cart event sent to PostHog')
  }

  const sendViaAPI = async () => {
    try {
      const response = await fetch('/api/posthog-test')
      const result = await response.json()
      console.log('API test result:', result)
      setEventsSent(prev => prev + 1)
      alert('API test completed - check console for details')
    } catch (error) {
      console.error('API test failed:', error)
      alert('API test failed - check console')
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">PostHog Test Page</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          PostHog API Key: {process.env.NEXT_PUBLIC_POSTHOG_KEY?.substring(0, 10)}...
        </p>
        <p className="text-sm text-blue-800">
          PostHog Host: {process.env.NEXT_PUBLIC_POSTHOG_HOST}
        </p>
        <p className="text-sm text-blue-800 font-semibold">
          Events Sent: {eventsSent}
        </p>
      </div>

      <div className="space-y-4">
        <button 
          onClick={sendTestEvent} 
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Send Test Event
        </button>
        
        <button 
          onClick={sendPageView} 
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Send Pageview Event
        </button>
        
        <button 
          onClick={identifyUser} 
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Identify Test User
        </button>
        
        <button 
          onClick={sendButtonClick} 
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Send Button Click Event
        </button>
        
        <button 
          onClick={sendAddToCart} 
          className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          Send Add to Cart Event (E-commerce)
        </button>
        
        <button 
          onClick={sendViaAPI} 
          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-bold"
        >
          🚀 Send Event via API (GUARANTEED TO WORK)
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click any button above to send events to PostHog</li>
          <li>Open your browser console to see event logs</li>
          <li>Check PostHog dashboard to verify events are received</li>
          <li>The events should appear in PostHog within a few seconds</li>
        </ol>
      </div>
    </div>
  )
}