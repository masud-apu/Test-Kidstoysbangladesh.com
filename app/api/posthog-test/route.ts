import { NextResponse } from 'next/server'

export async function GET() {
  const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  
  try {
    // Send a test event directly to PostHog API
    const response = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: 'test_event_from_api',
        properties: {
          distinct_id: 'test-user-' + Date.now(),
          timestamp: new Date().toISOString(),
          source: 'api_route_test',
          test_data: true,
          message: 'Manual test event from Next.js API route'
        },
        timestamp: new Date().toISOString(),
      }),
    })

    const result = await response.text()
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      message: 'Test event sent to PostHog',
      posthog_response: result,
      event_details: {
        api_key: POSTHOG_KEY?.substring(0, 10) + '...',
        host: POSTHOG_HOST,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      api_key: POSTHOG_KEY?.substring(0, 10) + '...',
      host: POSTHOG_HOST
    }, { status: 500 })
  }
}