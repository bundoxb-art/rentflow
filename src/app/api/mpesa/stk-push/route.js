import { NextResponse } from 'next/server'

// Get M-Pesa access token
async function getAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  const response = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  )
  const data = await response.json()
  return data.access_token
}

export async function POST(request) {
  try {
    const { phone, amount, tenantId, tenantName } = await request.json()

    // Format phone number
    let formattedPhone = phone.replace(/\s/g, '').replace('+', '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    }

    const accessToken = await getAccessToken()

    const shortCode = process.env.MPESA_SHORTCODE
    const passkey = process.env.MPESA_PASSKEY
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64')

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`

    const response = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: formattedPhone,
          PartyB: shortCode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: tenantId,
          TransactionDesc: `Rent payment - ${tenantName}`,
        }),
      }
    )

    const data = await response.json()

    if (data.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        message: 'STK Push sent successfully',
        checkoutRequestId: data.CheckoutRequestID,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: data.errorMessage || 'Failed to send STK Push',
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message,
    })
  }
}