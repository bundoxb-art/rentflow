import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  const protectedRoutes = ['/dashboard', '/tenant']
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtected) {
    const cookieStore = request.cookies
    
    // Check all possible Supabase cookie names
    const hasSession = 
      cookieStore.get('sb-vrelkjytegukqxgustmj-auth-token') ||
      cookieStore.get('sb-access-token') ||
      cookieStore.get('supabase-auth-token') ||
      cookieStore.get('sb-vrelkjytegukqxgustmj-auth-token-code-verifier') ||
      // Check any cookie that starts with sb-
      [...cookieStore.getAll()].some(c => c.name.startsWith('sb-'))

    if (!hasSession) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/tenant/:path*']
}
