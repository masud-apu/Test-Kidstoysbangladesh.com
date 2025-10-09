import { NextRequest } from 'next/server'

// Simple, safe media proxy for videos to ensure correct Content-Type and same-origin
// Only proxies Cloudinary resources to avoid becoming an open proxy

const ALLOWED_HOSTS = new Set([
	'res.cloudinary.com',
])

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const u = searchParams.get('u')
		if (!u) {
			return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400 })
		}

		let target: URL
		try {
			target = new URL(u)
		} catch {
			return new Response(JSON.stringify({ error: 'Invalid url' }), { status: 400 })
		}

		if (!ALLOWED_HOSTS.has(target.hostname)) {
			return new Response(JSON.stringify({ error: 'Host not allowed' }), { status: 400 })
		}

		const upstream = await fetch(target.toString(), {
			// Ensure direct fetch, no caching issues
			cache: 'no-store',
			headers: {
				// Pass through basic headers to get the right asset
				Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.8',
			},
		})

		if (!upstream.ok || !upstream.body) {
			return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), { status: 502 })
		}

		// Forward critical headers only
		const contentType = upstream.headers.get('content-type') || 'video/mp4'
		const contentLength = upstream.headers.get('content-length') || undefined
		const acceptRanges = upstream.headers.get('accept-ranges') || 'bytes'

		return new Response(upstream.body, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				...(contentLength ? { 'Content-Length': contentLength } : {}),
				'Accept-Ranges': acceptRanges,
				// Same-origin so CORS not required; still allow safe reuse
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})
	} catch (err) {
		console.error('Media proxy error:', err)
		return new Response(JSON.stringify({ error: 'Proxy error' }), { status: 500 })
	}
}



