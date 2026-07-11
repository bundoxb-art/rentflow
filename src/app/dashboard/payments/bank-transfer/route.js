import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { tenant_id, amount, reference, landlord_id, apartment_id } = await request.json()

    const supabase = createClient(
      'https://vrelkjytegukqxgustmj.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

    const { data: payment, error } = await supabase.from('payments').insert({
      tenant_id,
      landlord_id,
      apartment_id,
      amount,
      month,
      method: 'bank_transfer',
      reference: reference || 'BANK-' + Date.now(),
      status: 'pending_confirmation'
    }).select().single()

    if (error) throw error

    await supabase.from('receipts').insert({
      payment_id: payment.id,
      tenant_id,
      apartment_id,
      amount,
      month,
      payment_method: 'bank_transfer',
      receipt_number: 'RF-' + Date.now(),
    })

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}