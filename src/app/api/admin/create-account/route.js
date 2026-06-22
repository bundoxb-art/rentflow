import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://vrelkjytegukqxgustmj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  }
)

export async function POST(request) {
  try {
    const { email, password, full_name, phone, role, extra } = await request.json()

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Create the account, pre-confirmed (no email link needed)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role }
    })

    if (userError) {
      return NextResponse.json({ success: false, message: userError.message }, { status: 400 })
    }

    const userId = userData.user.id
    let insertError = null

    if (role === 'manager') {
      const { error } = await supabaseAdmin.from('managers').insert({
        id: userId, full_name, email, phone,
        company_name: extra?.company_name, status: 'active'
      })
      insertError = error
    }

    if (role === 'super_admin') {
      const { error } = await supabaseAdmin.from('super_admins').insert({
        id: userId, full_name, email, phone,
        manager_id: extra?.manager_id, status: 'active', created_by: extra?.created_by
      })
      insertError = error
    }

    if (role === 'apartment_admin') {
      const { error } = await supabaseAdmin.from('apartment_admins').insert({
        id: userId, full_name, email, phone,
        super_admin_id: extra?.super_admin_id, apartment_id: extra?.apartment_id,
        status: 'active', created_by: extra?.created_by
      })
      insertError = error
    }

    if (role === 'landlord') {
      const { error } = await supabaseAdmin.from('landlord_profiles').insert({
        id: userId, full_name, email, phone,
        admin_id: extra?.admin_id, apartment_id: extra?.apartment_id,
        status: 'approved', created_by: extra?.created_by, approved_at: new Date().toISOString()
      })
      insertError = error
      if (!insertError) {
        await supabaseAdmin.from('profiles').upsert({
          id: userId, full_name, email, role: 'landlord', status: 'approved'
        })
      }
    }

    if (insertError) {
      // Roll back the auth account if the profile insert failed
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ success: false, message: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user_id: userId })

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}