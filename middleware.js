import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Protect these routes
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/properties',
    '/dashboard/payments',
    '/dashboard/tenants',
    '/dashboard/reminders',
    '/dashboard/reports',
    '/dashboard/settings',
    '/tenant',
  ]

  const isProtected = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isProtected) {
    const token = request.cookies.get('sb-vrelkjytegukqxgustmj-auth-token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  // Redirect logged in users away from auth page
  if (pathname === '/auth') {
    const token = request.cookies.get('sb-vrelkjytegukqxgustmj-auth-token')
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tenant/:path*',
    '/auth',
  ]
}