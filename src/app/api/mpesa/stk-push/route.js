import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://vrelkjytegukqxgustmj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'
)

async function getSettings() {
  const { data } = await supabase
    .from('system_settings')
    .select('key, value');

  const settings = {};
  (data || []).forEach(s => { settings[s.key] = s.value; });
  return settings;
}

async function getAccessToken(consumerKey, consumerSecret, environment) {
  const baseUrl = environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await fetch(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { 'Authorization': `Basic ${auth}` } }
  );

  const text = await response.text();
  if (!text) throw new Error('Empty token response');
  const data = JSON.parse(text);
  return data.access_token;
}

export async function POST(request) {
  try {
    const { phone, amount, tenantId, tenantName, isDeposit } = await request.json();

    // Get settings from database
    const settings = await getSettings();

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortCode = settings.mpesa_shortcode || process.env.MPESA_SHORTCODE || '174379';
    const passkey = settings.mpesa_passkey || process.env.MPESA_PASSKEY;
    const environment = settings.mpesa_environment || 'sandbox';

    // Format phone
    let formattedPhone = phone.toString().replace(/\s/g, '').replace('+', '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    const accessToken = await getAccessToken(consumerKey, consumerSecret, environment);

    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    const baseUrl = environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    const stkResponse = await fetch(
      `${baseUrl}/mpesa/stkpush/v1/processrequest`,
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
          AccountReference: isDeposit ? 'DEPOSIT' : tenantId,
          TransactionDesc: isDeposit ? `Activation Deposit` : `Rent - ${tenantName}`,
        }),
      }
    );

    const stkText = await stkResponse.text();
    if (!stkText) return NextResponse.json({ success: false, message: 'No response from M-Pesa' });

    const stkData = JSON.parse(stkText);

    if (stkData.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        message: 'M-Pesa prompt sent! Enter your PIN.',
        checkoutRequestId: stkData.CheckoutRequestID,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed',
      });
    }

  } catch (error) {
    console.error('STK Push error:', error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
