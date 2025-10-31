import { auth } from '@/auth'

export default auth((req) => {
  // Routes that require authentication
  const isAccountRoute = req.nextUrl.pathname.startsWith('/account')

  if (isAccountRoute && !req.auth) {
    const newUrl = new URL('/auth/signin', req.nextUrl.origin)
    newUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
