"use client";
import { useState } from "react";

const PAYMENTS = [
  { id: 1, month: "May 2025", amount: 18000, status: "paid", date: "May 1, 2025", method: "M-Pesa", ref: "QK7X2M9P" },
  { id: 2, month: "Apr 2025", amount: 18000, status: "paid", date: "Apr 2, 2025", method: "M-Pesa", ref: "PL3N8R1T" },
  { id: 3, month: "Mar 2025", amount: 18000, status: "paid", date: "Mar 1, 2025", method: "Bank", ref: "BNK00123" },
  { id: 4, month: "Feb 2025", amount: 18000, status: "paid", date: "Feb 3, 2025", method: "M-Pesa", ref: "XM9K2L4Q" },
];

const fmt = (n) => "KSh " + n.toLocaleString();

export default function TenantPortal() {
  const [tab, setTab] = useState("home");
  const [showPay, setShowPay] = useState(false);
  const [payStep, setPayStep] = useState(1);
  const [phone, setPhone] = useState("0712 345 678");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handlePay = () => {
    if (payStep === 1) { setPayStep(2); return; }
    setShowPay(false);
    setPayStep(1);
    showToast("✓ M-Pesa prompt sent to " + phone);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">

      {/* TOP NAV */}
      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="text-xl font-extrabold text-[#f0b429]">
          Rent<span className="text-white">Flow</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold">Aisha Omondi</div>
            <div className="text-xs text-gray-500">Tenant · Unit A2</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#f0b429] flex items-center justify-center text-black font-extrabold text-sm">AO</div>
        </div>
      </nav>

      {/* MOBILE TABS */}
      <div className="flex bg-[#111827] border-b border-white/5 px-4 gap-1 sticky top-16 z-10">
        {[
          { key: "home", icon: "🏠", label: "Home" },
          { key: "payments", icon: "💳", label: "Payments" },
          { key: "receipts", icon: "🧾", label: "Receipts" },
          { key: "support", icon: "💬", label: "Support" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition border-b-2 ${tab === t.key ? "border-[#f0b429] text-[#f0b429]" : "border-transparent text-gray-500 hover:text-white"}`}>
            <span className="text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* HOME TAB */}
        {tab === "home" && (
          <div className="space-y-5">

            {/* Welcome */}
            <div className="bg-gradient-to-br from-[#f0b429] to-[#e09000] rounded-2xl p-6 text-black">
              <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Welcome back</div>
              <div className="text-2xl font-extrabold mb-1">Aisha Omondi 👋</div>
              <div className="text-sm opacity-80">Sunrise Apartments · Unit A2 · Mombasa Rd</div>
            </div>

            {/* Current Rent Status */}
            <div className="bg-[#111827] border border-red-400/20 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">May 2025 Rent</div>
                  <div className="text-3xl font-extrabold text-red-400">{fmt(18000)}</div>
                  <div className="text-xs text-gray-500 mt-1">Due: May 1, 2025 · Overdue by 10 days</div>
                </div>
                <span className="bg-red-400/10 text-red-400 border border-red-400/20 text-xs font-bold px-3 py-1.5 rounded-full">
                  ● Unpaid
                </span>
              </div>
              <button onClick={() => setShowPay(true)}
                className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition flex items-center justify-center gap-2">
                <span>📱</span> Pay with M-Pesa
              </button>
            </div>

            {/* Landlord Info */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">Your Landlord</div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-extrabold text-lg">JM</div>
                <div className="flex-1">
                  <div className="font-bold">John Mutua</div>
                  <div className="text-xs text-gray-500 mt-0.5">+254 700 123 456</div>
                </div>
                <button className="bg-green-400/10 text-green-400 border border-green-400/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-400/20 transition">
                  📞 Call
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Months Paid", value: "4", color: "text-green-400" },
                { label: "On Time", value: "3/4", color: "text-[#f0b429]" },
                { label: "Total Paid", value: "KSh 72K", color: "text-blue-400" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-4 text-center">
                  <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Notice */}
            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-2xl p-4 flex gap-3">
              <div className="text-xl">⚠️</div>
              <div>
                <div className="text-sm font-bold text-yellow-400 mb-1">Rent Overdue</div>
                <div className="text-xs text-gray-400">Your May rent is overdue. Please pay as soon as possible to avoid penalties. Contact your landlord if you need assistance.</div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {tab === "payments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-extrabold">Payment History</h2>
              <span className="text-xs text-gray-500">4 payments</span>
            </div>

            {PAYMENTS.map((p) => (
              <div key={p.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/10 transition">
                <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center text-xl flex-shrink-0">✅</div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{p.month}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{p.date} · via {p.method}</div>
                  <div className="text-xs text-gray-600 mt-0.5 font-mono">Ref: {p.ref}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-green-400">{fmt(p.amount)}</div>
                  <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-0.5 rounded-full">Paid</span>
                </div>
              </div>
            ))}

            {/* Current month unpaid */}
            <div className="bg-[#111827] border border-red-400/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-400/10 flex items-center justify-center text-xl flex-shrink-0">❌</div>
              <div className="flex-1">
                <div className="font-bold text-sm">May 2025</div>
                <div className="text-xs text-gray-500 mt-0.5">Due: May 1, 2025 · Overdue</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-red-400">{fmt(18000)}</div>
                <button onClick={() => setShowPay(true)} className="text-xs bg-[#f0b429] text-black font-bold px-3 py-1 rounded-full mt-1 hover:opacity-90 transition">
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RECEIPTS TAB */}
        {tab === "receipts" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold mb-2">Receipts</h2>
            {PAYMENTS.map((p) => (
              <div key={p.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Receipt</div>
                    <div className="font-extrabold text-lg mt-1">{p.month}</div>
                  </div>
                  <span className="bg-green-400/10 text-green-400 border border-green-400/20 text-xs font-bold px-3 py-1 rounded-full">● Paid</span>
                </div>
                {[
                  ["Tenant", "Aisha Omondi"],
                  ["Property", "Sunrise Apartments · Unit A2"],
                  ["Amount", fmt(p.amount)],
                  ["Date Paid", p.date],
                  ["Method", p.method],
                  ["Reference", p.ref],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-bold font-mono text-xs">{v}</span>
                  </div>
                ))}
                <button onClick={() => showToast("📄 Receipt downloaded!")}
                  className="w-full mt-4 bg-white/5 text-gray-300 border border-white/10 font-bold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                  ⬇ Download PDF Receipt
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SUPPORT TAB */}
        {tab === "support" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold mb-2">Support & Help</h2>
            {[
              { icon: "📞", title: "Call Landlord", sub: "John Mutua · +254 700 123 456", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
              { icon: "💬", title: "WhatsApp Landlord", sub: "Send a message directly", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
              { icon: "🔧", title: "Report Maintenance Issue", sub: "Plumbing, electricity, or other repairs", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
              { icon: "📄", title: "Request Rent Statement", sub: "Get a full payment history document", color: "text-[#f0b429]", bg: "bg-[#f0b429]/10 border-[#f0b429]/20" },
            ].map((s, i) => (
              <button key={i} onClick={() => showToast(`Opening ${s.title}...`)}
                className={`w-full bg-[#111827] border ${s.bg} rounded-2xl p-5 flex items-center gap-4 hover:opacity-90 transition text-left`}>
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

      {/* M-PESA PAYMENT MODAL */}
      {showPay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          onClick={() => { setShowPay(false); setPayStep(1); }}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 w-full max-w-sm" onClick={e => e.stopPropagation()}>

            {payStep === 1 ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">📱</div>
                  <div className="font-extrabold text-xl">Pay with M-Pesa</div>
                  <div className="text-gray-500 text-sm mt-1">May 2025 Rent</div>
                </div>

                <div className="bg-[#0d1117] rounded-2xl p-4 mb-6 text-center">
                  <div className="text-xs text-gray-500 mb-1">Amount to Pay</div>
                  <div className="text-3xl font-extrabold text-[#f0b429]">{fmt(18000)}</div>
                </div>

                <div className="mb-6">
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">M-Pesa Phone Number</label>
                  <div className="flex gap-2">
                    <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm flex items-center">🇰🇪 +254</div>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
                  </div>
                </div>

                <button onClick={handlePay} className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition">
                  Send M-Pesa Prompt →
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4 animate-bounce">📲</div>
                  <div className="font-extrabold text-xl mb-2">Check Your Phone!</div>
                  <div className="text-gray-400 text-sm">An M-Pesa prompt has been sent to</div>
                  <div className="text-[#f0b429] font-extrabold mt-1">+254 {phone}</div>
                </div>

                <div className="bg-[#0d1117] rounded-2xl p-4 mb-6 space-y-2 text-sm">
                  {["Enter your M-Pesa PIN", "Confirm the KSh 18,000 payment", "You will receive an SMS confirmation"].map((s, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="w-6 h-6 rounded-full bg-[#f0b429] text-black text-xs font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                      <span className="text-gray-300">{s}</span>
                    </div>
                  ))}
                </div>

                <button onClick={handlePay} className="w-full bg-green-400 text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition">
                  ✓ I've Completed the Payment
                </button>
                <button onClick={() => { setShowPay(false); setPayStep(1); }}
                  className="w-full mt-3 bg-white/5 text-gray-400 font-bold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}