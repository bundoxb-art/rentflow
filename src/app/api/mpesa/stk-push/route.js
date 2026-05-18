import { NextResponse } from 'next/server'

async function getAccessToken() {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa credentials not configured')
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

    const response = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const text = await response.text()
    console.log('Access token response:', text)

    if (!text) throw new Error('Empty response from Safaricom')

    const data = JSON.parse(text)
    
    if (!data.access_token) {
      throw new Error('No access token: ' + JSON.stringify(data))
    }

    return data.access_token
  } catch (error) {
    console.error('getAccessToken error:', error.message)
    throw error
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { phone, amount, tenantId, tenantName } = body

    console.log('STK Push request:', { phone, amount, tenantId, tenantName })

    if (!phone || !amount) {
      return NextResponse.json({
        success: false,
        message: 'Phone and amount are required'
      })
    }

    // Format phone number
    let formattedPhone = phone.toString().replace(/\s/g, '').replace('+', '').replace('-', '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    }
    if (!formattedPhone.startsWith('254')) {
      formattedPhone = '254' + formattedPhone
    }

    console.log('Formatted phone:', formattedPhone)

    // Get access token
    let accessToken
    try {
      accessToken = await getAccessToken()
      console.log('Got access token successfully')
    } catch (tokenError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to get M-Pesa access token: ' + tokenError.message
      })
    }

    const shortCode = process.env.MPESA_SHORTCODE || '174379'
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
    
    const now = new Date()
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')

    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64')
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`

    console.log('STK Push params:', { shortCode, timestamp, callbackUrl, formattedPhone, amount })

    const stkResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(Number(amount)),
          PartyA: formattedPhone,
          PartyB: shortCode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: tenantId || 'RentFlow',
          TransactionDesc: `Rent payment for ${tenantName || 'tenant'}`,
        }),
      }
    )

    const stkText = await stkResponse.text()
    console.log('STK Push raw response:', stkText)

    if (!stkText) {
      return NextResponse.json({
        success: false,
        message: 'Empty response from M-Pesa STK Push'
      })
    }

    let stkData
    try {
      stkData = JSON.parse(stkText)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid response from M-Pesa: ' + stkText
      })
    }

    console.log('STK Push parsed response:', stkData)

    if (stkData.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        message: 'M-Pesa prompt sent! Check your phone and enter your PIN.',
        checkoutRequestId: stkData.CheckoutRequestID,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed',
        details: stkData
      })
    }

  } catch (error) {
    console.error('STK Push error:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error: ' + error.message
    }, { status: 500 })
  }
}
