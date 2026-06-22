import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set!')
      return NextResponse.json({
        success: false,
        message: 'Server configuration error — service key missing.'
      }, { status: 500 })
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      'https://vrelkjytegukqxgustmj.supabase.co',
      serviceKey
    )

    const body = await request.json()
    const { email, password, full_name, phone, role, extra } = body

    console.log('Creating account:', { email, role })

    // Basic validation
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({
        success: false,
        message: 'Please fill in all required fields'
      })
    }

    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters'
      })
    }

    // Check if already registered in role table FIRST
    if (role === 'manager') {
      const { data: existing } = await supabaseAdmin
        .from('managers')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      if (existing) {
        return NextResponse.json({
          success: false,
          message: 'This email is already registered. Please login instead.'
        })
      }
    }

    // Create auth user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role }
    })

    if (userError) {
      console.error('Auth user creation error:', userError.message)

      if (
        userError.message.includes('already been registered') ||
        userError.message.includes('already exists') ||
        userError.message.includes('duplicate')
      ) {
        // Auth user exists but no manager record - try to insert manager record
        if (role === 'manager') {
          // Get the existing user by email
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
          const existingUser = users?.find(u => u.email === email.toLowerCase())

          if (existingUser) {
            const { error: insertErr } = await supabaseAdmin.from('managers').insert({
              id: existingUser.id,
              full_name,
              email: email.toLowerCase(),
              phone: phone || '',
              company_name: extra?.company_name || '',
              status: 'active',
            })

            if (!insertErr) {
              return NextResponse.json({
                success: true,
                user_id: existingUser.id,
                message: 'Account setup complete!'
              })
            }
          }
        }

        return NextResponse.json({
          success: false,
          message: 'This email is already registered. Please login instead.'
        })
      }

      return NextResponse.json({
        success: false,
        message: userError.message
      })
    }

    const userId = userData.user.id
    console.log('Auth user created:', userId)

    // Insert into role-specific table
    let insertError = null

    if (role === 'manager') {
      console.log('Inserting into managers table...')
      const { error } = await supabaseAdmin
        .from('managers')
        .insert({
          id: userId,
          full_name: full_name,
          email: email.toLowerCase(),
          phone: phone || '',
          company_name: extra?.company_name || '',
          status: 'active',
        })
      insertError = error
      if (error) console.error('managers insert error:', error.message, error.details, error.hint)
    }

    else if (role === 'super_admin') {
      const { error } = await supabaseAdmin.from('super_admins').insert({
        id: userId,
        full_name,
        email: email.toLowerCase(),
        phone: phone || '',
        manager_id: extra?.manager_id,
        status: 'active',
        created_by: extra?.created_by,
      })
      insertError = error
      if (error) console.error('super_admins insert error:', error.message)
    }

    else if (role === 'apartment_admin') {
      const { error } = await supabaseAdmin.from('apartment_admins').insert({
        id: userId,
        full_name,
        email: email.toLowerCase(),
        phone: phone || '',
        super_admin_id: extra?.super_admin_id,
        apartment_id: extra?.apartment_id,
        status: 'active',
        created_by: extra?.created_by,
      })
      insertError = error
      if (error) console.error('apartment_admins insert error:', error.message)
    }

    else if (role === 'landlord') {
      const { error } = await supabaseAdmin.from('landlord_profiles').insert({
        id: userId,
        full_name,
        email: email.toLowerCase(),
        phone: phone || '',
        admin_id: extra?.admin_id,
        apartment_id: extra?.apartment_id,
        status: 'approved',
        created_by: extra?.created_by,
        approved_at: new Date().toISOString(),
      })
      insertError = error
      if (!error) {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          full_name,
          email: email.toLowerCase(),
          role: 'landlord',
          status: 'approved',
        })
      }
      if (error) console.error('landlord_profiles insert error:', error.message)
    }

    // If insert failed, delete auth user to prevent orphan
    if (insertError) {
      console.error('Rolling back — deleting auth user:', userId)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({
        success: false,
        message: 'Account setup failed: ' + insertError.message
      })
    }

    console.log('Account created successfully:', userId, role)
    return NextResponse.json({
      success: true,
      user_id: userId,
      message: 'Account created successfully!'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error: ' + error.message
    }, { status: 500 })
  }
}
