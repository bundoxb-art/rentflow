"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const fmt = (n) => "KSh " + (n || 0).toLocaleString();

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["S","M","T","W","T","F","S"];

export default function TenantPortal() {
  const [tab, setTab] = useState("home");
  const [tenant, setTenant] = useState(null);
  const [payments, setPayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [payStep, setPayStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/tenant/login'; return; }

    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setPhone(user.user_metadata?.phone || "");

    // Check tenant profile
    const { data: tenantProfile } = await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('email', user.email)
      .single();

    if (tenantProfile?.status === 'pending') {
      window.location.href = '/tenant-pending';
      return;
    }

    // Get tenant data
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*')
      .eq('phone', user.user_metadata?.phone || user.phone)
      .single();

    if (!tenantData) {
      // Try by email in metadata
      const { data: tenantByEmail } = await supabase
        .from('tenants')
        .select('*')
        .eq('phone', tenantProfile?.phone || '')
        .single();
      setTenant(tenantByEmail);
    } else {
      setTenant(tenantData);
    }

    // Get payments
    if (tenantData) {
      const { data: pays } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .order('created_at', { ascending: false });
      setPayments(pays || []);

      // Get announcements
      const { data: ann } = await supabase
        .from('announcements')
        .select('*')
        .or(`type.eq.all,tenant_id.eq.${tenantData.id}`)
        .order('created_at', { ascending: false });
      setAnnouncements(ann || []);
    }

    setLoading(false);
  };

  const initiatePayment = async () => {
    if (!tenant) { showToast("Tenant data not found"); return; }
    setPayLoading(true);

    let formattedPhone = phone.replace(/\s/g, '').replace('+', '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone;

    try {
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          amount: tenant.rent_amount,
          tenantId: tenant.id,
          tenantName: tenant.name,
        })
      });

      const data = await res.json();

      if (data.success) {
        setPayStep(2);
      } else {
        showToast("❌ " + data.message);
      }
    } catch (err) {
      showToast("❌ Error: " + err.message);
    }
    setPayLoading(false);
  };

  const confirmPayment = async () => {
    showToast("✅ Payment confirmed! Receipt will be available shortly.");
    setShowPay(false);
    setPayStep(1);
    // Refresh payments
    setTimeout(checkSession, 3000);
  };

  const downloadReceipt = (payment) => {
    const receiptNo = 'RF-' + payment.id?.slice(0, 8).toUpperCase();
    const receiptDate = new Date(payment.created_at).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${receiptNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a2e; }
    .header { background: #111827; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; }
    .logo { font-size: 24px; font-weight: 900; color: #f0b429; }
    .logo span { color: white; }
    .badge { display: inline-block; background: #f0b429; color: black; font-size: 10px; font-weight: bold; padding: 3px 10px; border-radius: 20px; margin-top: 6px; }
    .receipt-no { color: #aaa; font-size: 12px; margin-top: 4px; }
    .body { border: 2px solid #111827; border-top: none; border-radius: 0 0 12px 12px; padding: 24px; }
    .amount-box { background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .amount { font-size: 40px; font-weight: 900; color: #0ea5e9; }
    .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .paid-badge { background: #dcfce7; border: 2px solid #16a34a; color: #16a34a; display: inline-block; padding: 6px 20px; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 10px 0; transform: rotate(-3deg); display: inline-block; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; }
    td:last-child { text-align: right; font-weight: bold; }
    .kra-box { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-top: 16px; }
    .kra-label { font-size: 10px; font-weight: bold; color: #92400e; text-transform: uppercase; }
    .kra-value { font-size: 11px; color: #78350f; margin-top: 4px; font-family: monospace; }
    .footer { text-align: center; margin-top: 20px; color: #999; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Rent<span>Flow</span></div>
    <div class="badge">OFFICIAL RECEIPT</div>
    <div class="receipt-no">Receipt No: ${receiptNo}</div>
  </div>
  <div class="body">
    <div class="amount-box">
      <div class="label">Amount Paid</div>
      <div class="amount">KSh ${Number(payment.amount).toLocaleString()}</div>
      <div class="paid-badge">✓ PAID</div>
    </div>

    <table>
      <tr><td>Receipt Number</td><td>${receiptNo}</td></tr>
      <tr><td>Tenant Name</td><td>${tenant?.name || user?.user_metadata?.full_name || '—'}</td></tr>
      <tr><td>Unit</td><td>Unit ${tenant?.unit || '—'}</td></tr>
      <tr><td>Payment Period</td><td>${payment.month}</td></tr>
      <tr><td>Amount (KES)</td><td>${Number(payment.amount).toLocaleString()}</td></tr>
      <tr><td>VAT (0% — Residential)</td><td>0.00</td></tr>
      <tr><td><strong>Total Paid (KES)</strong></td><td><strong>${Number(payment.amount).toLocaleString()}</strong></td></tr>
      <tr><td>Payment Method</td><td>${(payment.method || 'M-PESA').toUpperCase()}</td></tr>
      <tr><td>Transaction Ref</td><td>${payment.reference || '—'}</td></tr>
      <tr><td>Date Paid</td><td>${receiptDate}</td></tr>
    </table>

    <div class="kra-box">
      <div class="kra-label">🇰🇪 KRA eTIMS Reference</div>
      <div class="kra-value">
        Receipt: ${receiptNo} | Date: ${receiptDate}<br/>
        Taxpayer: RentFlow Properties | PIN: Pending KRA Registration<br/>
        Transaction Type: Residential Rent | VAT Category: Exempt
      </div>
    </div>

    <div class="footer">
      <p>This is an official digital receipt generated by RentFlow</p>
      <p>Built by BundoxxBrian · Mombasa, Kenya 🇰🇪</p>
      <p>Generated: ${new Date().toLocaleString('en-KE')}</p>
      <p style="margin-top:6px; color: #f0b429; font-weight:bold;">rentflow-lovat-omega.vercel.app</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RentFlow-Receipt-${receiptNo}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✅ Receipt downloaded!");
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const dueDay = 1;

  const isPaidMonth = (y, m) => {
    const monthName = new Date(y, m, 1).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });
    return payments.some(p => p.month === monthName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4 animate-bounce">⏳</div>
          <div>Loading your portal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">

      {/* TOP NAV */}
      <nav className="bg-[#111827] border-b border-white/5 px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="text-xl font-extrabold text-[#f0b429]">
          Rent<span className="text-white">Flow</span>
        </div>
        <div className="flex items-center gap-3">
          {announcements.length > 0 && (
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              {announcements.length}
            </div>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold">{user?.user_metadata?.full_name || tenant?.name || 'Tenant'}</div>
            <div className="text-xs text-gray-500">Unit {tenant?.unit || '—'}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#f0b429] flex items-center justify-center text-black font-extrabold text-sm">
            {(user?.user_metadata?.full_name || tenant?.name || 'T').charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* TABS */}
      <div className="flex bg-[#111827] border-b border-white/5 px-2 gap-1 sticky top-16 z-10 overflow-x-auto">
        {[
          { key: "home", icon: "🏠", label: "Home" },
          { key: "pay", icon: "💳", label: "Pay Rent" },
          { key: "calendar", icon: "📅", label: "Calendar" },
          { key: "receipts", icon: "🧾", label: "Receipts" },
          { key: "notices", icon: "📢", label: `Notices${announcements.length > 0 ? ` (${announcements.length})` : ''}` },
          { key: "support", icon: "💬", label: "Support" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 py-3 px-3 text-xs font-bold flex flex-col items-center gap-0.5 transition border-b-2 ${tab === t.key ? "border-[#f0b429] text-[#f0b429]" : "border-transparent text-gray-500 hover:text-white"}`}>
            <span className="text-base">{t.icon}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* HOME TAB */}
        {tab === "home" && (
          <div className="space-y-4">
            {/* Welcome */}
            <div className="bg-gradient-to-br from-[#f0b429] to-[#e09000] rounded-2xl p-5 text-black">
              <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Welcome back</div>
              <div className="text-2xl font-extrabold">
                {user?.user_metadata?.full_name || tenant?.name || 'Tenant'} 👋
              </div>
              <div className="text-sm opacity-80 mt-1">
                {tenant?.unit ? `Unit ${tenant.unit}` : '—'} · {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Current Status */}
            <div className={`bg-[#111827] border rounded-2xl p-5 ${tenant?.status === 'paid' ? 'border-green-400/20' : 'border-red-400/20'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                    {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })} Rent
                  </div>
                  <div className={`text-3xl font-extrabold ${tenant?.status === 'paid' ? 'text-green-400' : 'text-red-400'}`}>
                    {fmt(tenant?.rent_amount || 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Due: 1st of every month
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${tenant?.status === 'paid' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                  ● {tenant?.status === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              {tenant?.status !== 'paid' && (
                <button onClick={() => setTab('pay')}
                  className="w-full bg-[#f0b429] text-black font-extrabold py-3.5 rounded-xl text-sm hover:opacity-90 transition">
                  📱 Pay with M-Pesa
                </button>
              )}
              {tenant?.status === 'paid' && (
                <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-3 text-center">
                  <div className="text-green-400 font-bold text-sm">✅ This month is paid!</div>
                  <button onClick={() => setTab('receipts')}
                    className="text-xs text-gray-400 mt-1 hover:text-white transition">
                    View receipt →
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Months Paid", value: payments.length, color: "text-green-400" },
                { label: "Total Paid", value: `KSh ${(payments.reduce((s, p) => s + p.amount, 0) / 1000).toFixed(0)}K`, color: "text-[#f0b429]" },
                { label: "Notices", value: announcements.length, color: "text-blue-400" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-4 text-center">
                  <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Latest Announcement */}
            {announcements.length > 0 && (
              <div className="bg-blue-400/10 border border-blue-400/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-400 font-bold text-sm">📢 Notice from Landlord</span>
                </div>
                <div className="font-bold text-sm mb-1">{announcements[0].title}</div>
                <div className="text-gray-400 text-xs">{announcements[0].message}</div>
                {announcements.length > 1 && (
                  <button onClick={() => setTab('notices')}
                    className="text-blue-400 text-xs mt-2 hover:underline">
                    View all {announcements.length} notices →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* PAY RENT TAB */}
        {tab === "pay" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Pay Rent 💳</h2>

            {tenant?.status === 'paid' ? (
              <div className="bg-green-400/10 border border-green-400/20 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <div className="font-extrabold text-xl text-green-400 mb-2">Already Paid!</div>
                <div className="text-gray-400 text-sm mb-4">
                  Your rent for this month has been received.
                </div>
                <button onClick={() => setTab('receipts')}
                  className="bg-green-400/10 text-green-400 border border-green-400/20 font-bold px-6 py-3 rounded-xl text-sm">
                  Download Receipt →
                </button>
              </div>
            ) : (
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">📱</div>
                  <div className="font-extrabold text-xl">Pay via M-Pesa</div>
                  <div className="text-gray-500 text-sm mt-1">Secure · Instant · Automatic Receipt</div>
                </div>

                <div className="bg-[#0d1117] rounded-2xl p-4 mb-6 text-center">
                  <div className="text-xs text-gray-500 mb-1">Amount Due</div>
                  <div className="text-3xl font-extrabold text-[#f0b429]">{fmt(tenant?.rent_amount || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
                  </div>
                </div>

                {payStep === 1 && (
                  <>
                    <div className="mb-4">
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                        M-Pesa Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm flex items-center">🇰🇪 +254</div>
                        <input value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="712 345 678"
                          className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
                      </div>
                    </div>

                    <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4">
                      <p className="text-yellow-400 text-xs font-bold">💡 How it works:</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Enter your M-Pesa number → Click Pay → Enter PIN on your phone → Done! Receipt auto-generated.
                      </p>
                    </div>

                    <button onClick={initiatePayment} disabled={payLoading}
                      className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2">
                      {payLoading ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending prompt...</>
                      ) : "Send M-Pesa Prompt →"}
                    </button>
                  </>
                )}

                {payStep === 2 && (
                  <>
                    <div className="text-center mb-6">
                      <div className="text-5xl mb-3 animate-bounce">📲</div>
                      <div className="font-extrabold text-lg mb-2">Check Your Phone!</div>
                      <div className="text-gray-400 text-sm">M-Pesa prompt sent to +254{phone}</div>
                    </div>

                    <div className="bg-[#0d1117] rounded-2xl p-4 mb-4 space-y-3">
                      {[
                        "Enter your M-Pesa PIN",
                        "Confirm the payment",
                        "Receipt will be generated automatically",
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#f0b429] text-black text-xs font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                          <span className="text-gray-300 text-sm">{s}</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={confirmPayment}
                      className="w-full bg-green-400 text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition mb-3">
                      ✓ I&apos;ve Completed the Payment
                    </button>
                    <button onClick={() => setPayStep(1)}
                      className="w-full bg-white/5 text-gray-400 font-bold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                      ← Try Again
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* CALENDAR TAB */}
        {tab === "calendar" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Payment Calendar 📅</h2>

            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-5">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center">←</button>
                <div className="font-extrabold">{MONTHS[month]} {year}</div>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center">→</button>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d, i) => (
                  <div key={i} className="text-center text-xs font-bold text-gray-500 py-2">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`prev-${i}`} className="aspect-square flex items-center justify-center text-xs text-gray-700">
                    {daysInPrevMonth - firstDay + i + 1}
                  </div>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                  const isDueDay = day === dueDay;
                  const paid = isPaidMonth(year, month);
                  const isOverdue = isDueDay && new Date(year, month, day) < new Date() && !paid;

                  return (
                    <div key={day}
                      className={`aspect-square flex flex-col items-center justify-center text-xs rounded-xl relative
                        ${isToday ? "bg-white/10 ring-2 ring-[#f0b429]" : ""}
                        ${isDueDay && paid ? "bg-green-400/20" : ""}
                        ${isDueDay && !paid && !isOverdue ? "bg-yellow-400/20" : ""}
                        ${isOverdue ? "bg-red-400/20" : ""}
                      `}>
                      <span className={`font-bold text-sm
                        ${isDueDay && paid ? "text-green-400" : ""}
                        ${isDueDay && !paid ? "text-red-400" : ""}
                        ${isToday && !isDueDay ? "text-[#f0b429]" : ""}
                        ${!isDueDay && !isToday ? "text-gray-300" : ""}
                      `}>{day}</span>
                      {isDueDay && (
                        <span className="text-[8px] mt-0.5">
                          {paid ? "✓" : "DUE"}
                        </span>
                      )}
                      {isToday && (
                        <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#f0b429]" />
                      )}
                    </div>
                  );
                })}
                {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }, (_, i) => (
                  <div key={`next-${i}`} className="aspect-square flex items-center justify-center text-xs text-gray-700">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
                {[
                  { color: "bg-green-400/20", text: "text-green-400", label: "Paid" },
                  { color: "bg-red-400/20", text: "text-red-400", label: "Due/Overdue" },
                  { color: "bg-yellow-400/20", text: "text-yellow-400", label: "Due Soon" },
                  { color: "bg-white/10", text: "text-[#f0b429]", label: "Today" },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${l.color}`} />
                    <span className={`text-xs ${l.text}`}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenancy Info */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
              <div className="font-extrabold mb-4">📋 Tenancy Details</div>
              {[
                ["Monthly Rent", fmt(tenant?.rent_amount || 0)],
                ["Due Date", "1st of every month"],
                ["Unit", tenant?.unit || "—"],
                ["Status", tenant?.status === 'paid' ? "✅ Paid this month" : "❌ Payment due"],
                ["Total Paid", fmt(payments.reduce((s, p) => s + p.amount, 0))],
                ["Months Paid", `${payments.length} months`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECEIPTS TAB */}
        {tab === "receipts" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Payment Receipts 🧾</h2>

            {payments.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">🧾</div>
                <div>No payments yet</div>
                <button onClick={() => setTab('pay')}
                  className="mt-4 bg-[#f0b429] text-black font-bold px-6 py-3 rounded-xl text-sm">
                  Pay Now →
                </button>
              </div>
            ) : payments.map(p => (
              <div key={p.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Receipt</div>
                    <div className="font-extrabold text-lg mt-1">{p.month}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(p.created_at).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <span className="bg-green-400/10 text-green-400 border border-green-400/20 text-xs font-bold px-3 py-1 rounded-full">
                    ● Confirmed
                  </span>
                </div>

                {[
                  ["Tenant", tenant?.name || "—"],
                  ["Unit", `Unit ${tenant?.unit || "—"}`],
                  ["Amount", fmt(p.amount)],
                  ["Method", p.method?.toUpperCase() || "M-PESA"],
                  ["Reference", p.reference || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-bold text-xs font-mono">{v}</span>
                  </div>
                ))}

                <button onClick={() => downloadReceipt(p)}
                  className="w-full mt-4 bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
                  ⬇️ Download Receipt
                </button>
              </div>
            ))}
          </div>
        )}

        {/* NOTICES TAB */}
        {tab === "notices" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Notices & Announcements 📢</h2>

            {announcements.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">📢</div>
                <div>No announcements yet</div>
              </div>
            ) : announcements.map(a => (
              <div key={a.id} className="bg-[#111827] border border-blue-400/20 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-extrabold text-base">{a.title}</div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${a.type === 'all' ? 'bg-blue-400/10 text-blue-400' : 'bg-[#f0b429]/10 text-[#f0b429]'}`}>
                    {a.type === 'all' ? '📢 All tenants' : '👤 Personal'}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">{a.message}</p>
                <div className="text-xs text-gray-500">
                  {new Date(a.created_at).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUPPORT TAB */}
        {tab === "support" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Support 💬</h2>
            {[
              { icon: "🔧", title: "Report Maintenance Issue", sub: "Plumbing, electricity or other repairs", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
              { icon: "📄", title: "Request Rent Statement", sub: "Get full payment history document", color: "text-[#f0b429]", bg: "bg-[#f0b429]/10 border-[#f0b429]/20" },
              { icon: "❓", title: "Payment Query", sub: "Questions about your payment", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
              { icon: "🚪", title: "Log Out", sub: "Sign out of your account", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
            ].map((s, i) => (
              <button key={i}
                onClick={async () => {
                  if (s.title === "Log Out") {
                    await supabase.auth.signOut();
                    window.location.href = '/tenant/login';
                  } else {
                    showToast(`Opening ${s.title}...`);
                  }
                }}
                className={`w-full bg-[#111827] border ${s.bg} rounded-2xl p-5 flex items-center gap-4 text-left`}>
                <div className={`text-2xl w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                <div>
                  <div className={`font-bold text-sm ${s.color}`}>{s.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
                </div>
                <div className="ml-auto text-gray-600">→</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TOAST */}
      <div className={`fixed bottom-6 right-4 sm:right-6 bg-[#f0b429] text-black font-extrabold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm z-[100] transition-all duration-300 max-w-xs ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}