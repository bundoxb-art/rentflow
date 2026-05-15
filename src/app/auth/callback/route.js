import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient(
      'https://vrelkjytegukqxgustmj.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}