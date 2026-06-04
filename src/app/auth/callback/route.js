import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = 'https://vrelkjytegukqxgustmj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Check existing profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Block landlords from Google OAuth
      if (profile?.role === 'landlord') {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/landlord/login?error=use_email`)
      }

      // New Google user - create as pending tenant
      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          email: user.email,
          role: 'tenant',
          status: 'pending'
        })

        // Create tenant request
        await supabase.from('tenant_requests').insert({
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          email: user.email,
          status: 'pending',
          user_id: user.id
        })
      }

      // Sign out and force OTP
      await supabase.auth.signOut()

      // Send OTP to their email
      await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false }
      })

      // Redirect to OTP page with email
      const params = new URLSearchParams({
        email: user.email,
        mode: 'google',
        role: profile?.role || 'tenant'
      })

      return NextResponse.redirect(`${origin}/verify-otp?${params}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}