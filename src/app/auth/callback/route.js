import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = createClient(
        'https://vrelkjytegukqxgustmj.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'
      )
      await supabase.auth.exchangeCodeForSession(code)
      return NextResponse.redirect(`${origin}/dashboard`)
    } catch (e) {
      console.error('Callback error:', e)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}