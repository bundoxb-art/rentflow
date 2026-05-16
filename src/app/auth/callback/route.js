import { NextResponse } from 'next/server'

export async function GET(request) {
  const { origin } = new URL(request.url)
  // Redirect to dashboard - the client will handle the token
  return NextResponse.redirect(`${origin}/dashboard`)
}
