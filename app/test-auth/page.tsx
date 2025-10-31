'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const [cookies, setCookies] = useState<string>('')

  useEffect(() => {
    // Get all cookies
    setCookies(document.cookie)
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Session Status</h2>
          <p>Status: <span className="font-mono">{status}</span></p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Session Data</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Browser Cookies</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto whitespace-pre-wrap break-all">
            {cookies || 'No cookies found'}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Browser Info</h2>
          <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}
