import { auth } from '@/auth'

export default auth((req) => {
  const url = req.nextUrl
  const hostname = url.hostname

  // Redirect www to non-www
  if (hostname.startsWith('www.')) {
    url.hostname = hostname.replace('www.', '')
    return Response.redirect(url)
  }

  // Routes that require authentication
  const isAccountRoute = url.pathname.startsWith('/account')

  if (isAccountRoute && !req.auth) {
    const newUrl = new URL('/auth/signin', url.origin)
    newUrl.searchParams.set('callbackUrl', url.pathname)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
