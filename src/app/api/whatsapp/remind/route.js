import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { phone, tenantName, amount, dueDate, unit, landlordName } = await request.json()

    let formattedPhone = phone.replace(/\s/g, '').replace('+', '')
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1)

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || '+14155238886'

    const message = `🏠 *RentFlow Rent Reminder*

Hi ${tenantName}!

This is a friendly reminder that your rent is due.

📋 *Details:*
- Unit: ${unit}
- Amount: KSh ${Number(amount).toLocaleString()}
- Due: ${dueDate}

Pay easily via M-Pesa on the RentFlow portal.

_${landlordName} via RentFlow_`

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${fromWhatsApp}`,
          To: `whatsapp:+${formattedPhone}`,
          Body: message,
        })
      }
    )

    const data = await response.json()

    if (data.sid) {
      return NextResponse.json({ success: true, message: 'WhatsApp reminder sent!' })
    } else {
      throw new Error(data.message || 'Failed to send WhatsApp')
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}