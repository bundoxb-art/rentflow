import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vrelkjytegukqxgustmj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'
)

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2))

    const callbackData = body.Body?.stkCallback

    // Payment was successful
    if (callbackData?.ResultCode === 0) {
      const metadata = callbackData.CallbackMetadata?.Item || []

      // Extract payment details
      const amount = metadata.find(i => i.Name === 'Amount')?.Value
      const mpesaReceiptNumber = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value
      const phone = metadata.find(i => i.Name === 'PhoneNumber')?.Value
      const tenantId = callbackData.AccountReference

      console.log('Payment successful:', { amount, mpesaReceiptNumber, phone, tenantId })

      // Update tenant status to paid in Supabase
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({ status: 'paid' })
        .eq('id', tenantId)

      if (tenantError) {
        console.error('Error updating tenant:', tenantError)
      }

      // Record payment in payments table
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: tenantId,
          amount: amount,
          month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          method: 'mpesa',
          reference: mpesaReceiptNumber,
          status: 'confirmed',
        })

      if (paymentError) {
        console.error('Error recording payment:', paymentError)
      }

      console.log('✅ Payment recorded successfully for tenant:', tenantId)
    } else {
      // Payment failed or cancelled
      console.log('Payment failed:', callbackData?.ResultDesc)
    }

    // Always return success to Safaricom
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    })
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: 'RentFlow M-Pesa Callback Endpoint is active ✅',
    timestamp: new Date().toISOString(),
  })
}