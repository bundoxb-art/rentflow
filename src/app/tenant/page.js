"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const PAYMENTS = [
  { id: 1, month: "May 2025", amount: 18000, status: "paid", date: "May 1, 2025", method: "M-Pesa", ref: "QK7X2M9P" },
  { id: 2, month: "Apr 2025", amount: 18000, status: "paid", date: "Apr 2, 2025", method: "M-Pesa", ref: "PL3N8R1T" },
  { id: 3, month: "Mar 2025", amount: 18000, status: "paid", date: "Mar 1, 2025", method: "Bank", ref: "BNK00123" },
  { id: 4, month: "Feb 2025", amount: 18000, status: "paid", date: "Feb 3, 2025", method: "M-Pesa", ref: "XM9K2L4Q" },
];

const fmt = (n) => "KSh " + n.toLocaleString();

function MaintenanceForm({ tenant, user, showToast }) {
  const [issueType, setIssueType] = useState("plumbing");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!details.trim()) {
      showToast("Please describe the issue before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("maintenance_requests").insert({
        tenant_id: tenant?.id ?? null,
        user_id: user?.id ?? null,
        issue_type: issueType,
        description: details.trim(),
        status: "new",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setDetails("");
      setIssueType("plumbing");
      showToast("Maintenance request submitted successfully.");
    } catch (err) {
      console.error("Maintenance request failed:", err);
      showToast("We couldn't submit that request right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#111827] border border-white/5 rounded-2xl p-5 space-y-4">
      <div>
        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Report a maintenance issue</div>
        <div className="text-sm text-gray-400">Let us know what needs attention in your unit.</div>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">Issue Type</label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition"
        >
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="appliance">Appliance</option>
          <option value="security">Security</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">Details</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          placeholder="Describe the issue, how urgent it is, and anything helpful for the maintenance team."
          className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70"
      >
        {submitting ? "Submitting..." : "Submit Maintenance Request"}
      </button>
    </form>
  );
}

export default function TenantPortal() {
  const [tab, setTab] = useState("home");
  const [showPay, setShowPay] = useState(false);
  const [payStep, setPayStep] = useState(1);
  const [phone, setPhone] = useState("0712 345 678");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tenantProfile, setTenantProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dueDay = tenant?.due_day || tenant?.dueDay || 1;

  const isPaidMonth = (y, m) => {
    if (!payments || payments.length === 0) return false;
    return payments.some(p => {
      const d = new Date(p.created_at || p.date || p.paid_at || p.createdAt);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const checkSession = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = '/tenant/login';
        return;
      }

      const user = session.user;
      setUser(user);

      // Get tenant profile
      let profile = null;
      const { data: p1 } = await supabase
        .from('tenant_profiles').select('*')
        .eq('id', user.id).maybeSingle();
      profile = p1;

      if (!profile) {
        const { data: p2 } = await supabase
          .from('tenant_profiles').select('*')
          .eq('email', user.email).maybeSingle();
        profile = p2;
      }

      if (!profile || profile.status === 'pending') {
        window.location.href = '/tenant-pending';
        return;
      }

      if (profile.status === 'rejected') {
        await supabase.auth.signOut();
        window.location.href = '/tenant/login';
        return;
      }

      setTenantProfile(profile);

      // Get tenant data
      let tenantData = null;
      const { data: t1 } = await supabase
        .from('tenants').select('*')
        .eq('user_id', user.id).maybeSingle();
      tenantData = t1;

      if (!tenantData) {
        const { data: t2 } = await supabase
          .from('tenants').select('*')
          .eq('email', user.email).maybeSingle();
        if (t2) {
          await supabase.from('tenants')
            .update({ user_id: user.id })
            .eq('id', t2.id);
          tenantData = t2;
        }
      }

      setTenant(tenantData);

      if (tenantData) {
        const [{ data: pays }, { data: ann }] = await Promise.all([
          supabase.from('payments').select('*')
            .eq('tenant_id', tenantData.id)
            .order('created_at', { ascending: false }),
          supabase.from('announcements').select('*')
            .or(`type.eq.all,tenant_id.eq.${tenantData.id}`)
            .order('created_at', { ascending: false })
        ]);
        setPayments(pays || []);
        setAnnouncements(ann || []);
      }

    } catch (err) {
      console.error('Session check error:', err);
      window.location.href = '/tenant/login';
    } finally {
      setLoading(false);
    }
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
          {announcements.length > 0 && (
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              {announcements.length}
            </div>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold">
              {tenantProfile?.full_name || user?.user_metadata?.full_name || 'Tenant'}
            </div>
            <div className="text-xs text-gray-500">Unit {tenant?.unit || tenantProfile?.unit || '—'}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#f0b429] flex items-center justify-center text-black font-extrabold text-sm">
            {(tenantProfile?.full_name || user?.user_metadata?.full_name || 'T').charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* MOBILE TABS */}
      <div className="flex bg-[#111827] border-b border-white/5 px-4 gap-1 sticky top-16 z-10">
        {[
          { key: "home", icon: "🏠", label: "Home" },
          { key: "payments", icon: "💳", label: "Payments" },
          { key: "receipts", icon: "🧾", label: "Receipts" },
          { key: "calendar", icon: "📆", label: "Calendar" },
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
              <div className="text-2xl font-extrabold mb-1">{tenantProfile?.full_name || user?.user_metadata?.full_name || 'Tenant'} 👋</div>
              <div className="text-sm opacity-80">{tenant?.property_name ? `${tenant.property_name} · Unit ${tenant.unit}` : (tenantProfile?.unit ? `Unit ${tenantProfile.unit}` : '—')} · {tenant?.location || ''}</div>
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
                  ["Tenant", tenantProfile?.full_name || user?.user_metadata?.full_name || 'Tenant'],
                  ["Property", tenant?.property_name ? `${tenant.property_name} · Unit ${tenant.unit}` : (tenantProfile?.unit ? `Unit ${tenantProfile.unit}` : '—')],
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


        {/* CALENDAR TAB */}
        {tab === "calendar" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Payment Calendar 📅</h2>

            {/* Countdown Card */}
            {(() => {
              const today = new Date();
              const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
              const isPaid = tenant?.status === 'paid' || isPaidMonth(today.getFullYear(), today.getMonth());
              
              let daysInfo;
              if (isPaid) {
                const lastPayment = payments[0];
                const lastPaidDate = lastPayment ? new Date(lastPayment.created_at || lastPayment.date) : null;
                const daysSincePaid = lastPaidDate ? Math.floor((today - lastPaidDate) / (1000 * 60 * 60 * 24)) : 0;
                const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
                const daysUntilNext = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
                daysInfo = { type: 'paid', daysSincePaid, daysUntilNext };
              } else {
                const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays > 0) {
                  daysInfo = { type: 'upcoming', days: diffDays };
                } else {
                  daysInfo = { type: 'overdue', days: Math.abs(diffDays) };
                }
              }

              return (
                <div className={`rounded-2xl p-5 border ${
                  daysInfo.type === 'paid' ? 'bg-green-400/10 border-green-400/20' :
                  daysInfo.type === 'overdue' ? 'bg-red-400/10 border-red-400/20' :
                  'bg-[#f0b429]/10 border-[#f0b429]/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      {daysInfo.type === 'paid' && (
                        <>
                          <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-1">✅ Rent Paid</div>
                          <div className="text-2xl font-extrabold text-green-400">
                            {daysInfo.daysSincePaid === 0 ? 'Paid today!' : `Paid ${daysInfo.daysSincePaid} day${daysInfo.daysSincePaid !== 1 ? 's' : ''} ago`}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Next payment due in {daysInfo.daysUntilNext} day{daysInfo.daysUntilNext !== 1 ? 's' : ''}
                          </div>
                        </>
                      )}
                      {daysInfo.type === 'upcoming' && (
                        <>
                          <div className="text-xs text-[#f0b429] font-bold uppercase tracking-wider mb-1">⏳ Payment Due Soon</div>
                          <div className="text-2xl font-extrabold text-[#f0b429]">
                            {daysInfo.days} day{daysInfo.days !== 1 ? 's' : ''} remaining
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Rent due on the {dueDay}{dueDay === 1 ? 'st' : 'th'} of every month
                          </div>
                        </>
                      )}
                      {daysInfo.type === 'overdue' && (
                        <>
                          <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">⚠️ Payment Overdue</div>
                          <div className="text-2xl font-extrabold text-red-400">
                            {daysInfo.days} day{daysInfo.days !== 1 ? 's' : ''} overdue
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Please pay as soon as possible
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-5xl">
                      {daysInfo.type === 'paid' ? '✅' : daysInfo.type === 'overdue' ? '⚠️' : '⏳'}
                    </div>
                  </div>
                  {daysInfo.type !== 'paid' && (
                    <button onClick={() => setShowPay(true)}
                      className="w-full mt-4 bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                      📱 Pay Now
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Calendar Grid */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-5">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center">←</button>
                <div className="font-extrabold">{MONTHS[month]} {year}</div>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center">→</button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d, i) => (
                  <div key={i} className="text-center text-xs font-bold text-gray-500 py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`prev-${i}`} className="aspect-square flex items-center justify-center text-xs text-gray-700">
                    {new Date(year, month, 0).getDate() - firstDay + i + 1}
                  </div>
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                  const isDueDay = day === dueDay;
                  const paid = isPaidMonth(year, month);
                  const thisDate = new Date(year, month, day);
                  const isPast = thisDate < new Date(new Date().setHours(0,0,0,0));
                  const isOverdue = isDueDay && isPast && !paid;

                  return (
                    <div key={day}
                      className={`aspect-square flex flex-col items-center justify-center text-xs rounded-xl relative
                        ${isToday ? "ring-2 ring-[#f0b429]" : ""}
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
                          {paid ? "✓ PAID" : "DUE"}
                        </span>
                      )}
                      {isToday && (
                        <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#f0b429]" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
                {[
                  { color: "bg-green-400/20", text: "text-green-400", label: "Paid" },
                  { color: "bg-red-400/20", text: "text-red-400", label: "Overdue" },
                  { color: "bg-yellow-400/20", text: "text-yellow-400", label: "Due Soon" },
                  { color: "ring-2 ring-[#f0b429]", text: "text-[#f0b429]", label: "Today" },
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
                ["Tenant Name", tenantProfile?.full_name || user?.user_metadata?.full_name || "—"],
                ["Monthly Rent", fmt(tenant?.rent_amount || 0)],
                ["Due Date", `${dueDay}${dueDay === 1 ? 'st' : 'th'} of every month`],
                ["Unit", tenant?.unit || tenantProfile?.unit || "—"],
                ["Status", tenant?.status === 'paid' ? "✅ Paid this month" : "❌ Payment due"],
                ["Total Paid", fmt(payments.reduce((s, p) => s + (p.amount || 0), 0))],
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

        {/* SUPPORT TAB */}
        {tab === "support" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Support & Requests 💬</h2>

            <MaintenanceForm tenant={tenant} user={user} showToast={showToast} />

            <button onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/tenant/login';
              }}
              className="w-full bg-[#111827] border border-red-400/20 rounded-2xl p-4 flex items-center gap-4 text-left hover:bg-red-400/5 transition">
              <div className="text-2xl w-12 h-12 rounded-xl bg-red-400/10 flex items-center justify-center flex-shrink-0">🚪</div>
              <div>
                <div className="font-bold text-sm text-red-400">Log Out</div>
                <div className="text-xs text-gray-500 mt-0.5">Sign out of your account</div>
              </div>
            </button>
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

                {/* Bank Transfer Option */}
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 mt-4">
                  <div className="font-bold mb-3">🏦 Pay via Bank Transfer</div>
                  <div className="space-y-2 text-sm mb-4">
                    {[
                      ["Bank", "NCBA Bank Kenya"],
                      ["Account Name", "RentFlow Properties"],
                      ["Account No.", "488007"],
                      ["Branch", "Mombasa"],
                      ["Reference", `Unit ${tenant?.unit || '—'} — ${user?.user_metadata?.full_name}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-500">{k}</span>
                        <span className="font-bold text-xs">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4">
                    <p className="text-yellow-400 text-xs">
                      ⚠️ After transferring, click below to notify your landlord. They will confirm receipt.
                    </p>
                  </div>
                  <button onClick={async () => {
                    const ref = prompt("Enter your bank transfer reference number:");
                    if (!ref) return;
                    const res = await fetch('/api/payments/bank-transfer', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        tenant_id: tenant?.id,
                        amount: tenant?.rent_amount,
                        reference: ref,
                        landlord_id: tenant?.landlord_id,
                        apartment_id: tenant?.apartment_id,
                      })
                    });
                    const data = await res.json();
                    if (data.success) showToast("✅ Bank transfer recorded! Landlord will confirm.");
                    else showToast("❌ " + data.message);
                  }}
                    className="w-full bg-blue-500/10 text-blue-400 border border-blue-400/20 font-extrabold py-3 rounded-xl text-sm hover:bg-blue-500/20 transition">
                    🏦 I Have Transferred — Notify Landlord
                  </button>
                </div>
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
                  ✓ I&apos;ve Completed the Payment
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