"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

const STATUS = {
  paid: { label: "Paid", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  unpaid: { label: "Unpaid", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  partial: { label: "Partial", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
};

const fmt = (n) => "KSh " + (n || 0).toLocaleString();

export default function Dashboard() {
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: "", message: "", type: "all", tenant_id: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/landlord/login'; return; }

    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    // Check landlord profile
    const { data: profile } = await supabase
      .from('landlord_profiles')
      .select('*')
      .eq('email', user.email)
      .single();

    if (!profile && user.email !== 'bundoxb@gmail.com') {
      await supabase.auth.signOut();
      window.location.href = '/landlord/login';
      return;
    }

    if (profile?.status !== 'approved' && user.email !== 'bundoxb@gmail.com') {
      await supabase.auth.signOut();
      window.location.href = '/pending-approval';
      return;
    }

    fetchData();

    // Realtime updates
    const sub = supabase.channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(sub);
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/landlord/login';
      return;
    }

    // Fetch ONLY this landlord's tenants
    const { data: t, error: tError } = await supabase
      .from("tenants")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch ONLY this landlord's payments
    const { data: p } = await supabase
      .from("payments")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });

    console.log("Fetched tenants for landlord:", user.id, t);

    setTenants(t || []);
    setPayments(p || []);
    setLoading(false);
  };

  const sendReminder = async (tenant) => {
    showToast(`📱 Reminder sent to ${tenant.name}`);
    setSelected(null);
  };

  const sendAnnouncement = async () => {
    if (!announcement.title || !announcement.message) {
      showToast("Please fill in title and message");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('announcements').insert({
      landlord_id: user.id,
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      tenant_id: announcement.type === 'specific' ? announcement.tenant_id : null,
      priority: 'normal'
    });

    if (error) { showToast("Error: " + error.message); return; }

    setShowAnnouncement(false);
    setAnnouncement({ title: "", message: "", type: "all", tenant_id: "" });
    showToast("📢 Announcement sent!");
  };

  const filtered = tenants.filter(t => {
    const matchF = filter === "all" || t.status === filter;
    const matchS = t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.unit?.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const totalRent = tenants.reduce((s, t) => s + (t.rent_amount || 0), 0);
  const totalPaid = tenants.filter(t => t.status === "paid").reduce((s, t) => s + (t.rent_amount || 0), 0);
  const paidCount = tenants.filter(t => t.status === "paid").length;
  const unpaidCount = tenants.filter(t => t.status !== "paid").length;
  const rate = totalRent > 0 ? Math.round((totalPaid / totalRent) * 100) : 0;

  const isAdmin = user?.email === 'bundoxb@gmail.com';

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex font-sans">
      <Sidebar />

      <main className="flex-1 overflow-auto pb-20 md:pb-0">

        {/* TOP BAR */}
        <div className="sticky top-0 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-base sm:text-xl font-extrabold">
              {isAdmin ? "Admin View" : "Landlord Dashboard"} 👋
            </h1>
            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">
              {new Date().toLocaleDateString('en-KE', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAnnouncement(true)}
              className="bg-blue-500/10 text-blue-400 border border-blue-400/20 font-extrabold px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-blue-500/20 transition">
              📢 Announce
            </button>
            {isAdmin && (
              <Link href="/admin"
                className="bg-red-500/10 text-red-400 border border-red-400/20 font-extrabold px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-red-500/20 transition">
                🔐 Admin
              </Link>
            )}
          </div>
        </div>

        {/* READ ONLY NOTICE */}
        {!isAdmin && (
          <div className="mx-4 sm:mx-8 mt-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 flex items-center gap-2">
            <span className="text-yellow-400 text-sm">⚠️</span>
            <span className="text-yellow-400 text-xs font-bold">
              Read-only view. Tenant payments are processed automatically through M-Pesa.
            </span>
          </div>
        )}

        <div className="px-4 sm:px-8 py-4 sm:py-6">

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Expected", value: fmt(totalRent), sub: `${tenants.length} tenants`, accent: "#f0b429", icon: "💰" },
              { label: "Collected", value: fmt(totalPaid), sub: `${paidCount} paid`, accent: "#4ade80", icon: "✅" },
              { label: "Outstanding", value: fmt(totalRent - totalPaid), sub: `${unpaidCount} pending`, accent: "#f87171", icon: "⚠️" },
              { label: "Collection", value: `${rate}%`, sub: "This month", accent: rate >= 75 ? "#4ade80" : "#facc15", icon: "📊" },
            ].map((s, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-3 sm:p-5"
                style={{ borderLeft: `3px solid ${s.accent}` }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                  <div>{s.icon}</div>
                </div>
                <div className="text-lg sm:text-2xl font-extrabold" style={{ color: s.accent }}>{s.value}</div>
                <div className="text-xs text-gray-600 mt-1 hidden sm:block">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            {[
              { key: "all", label: `All (${tenants.length})`, color: "#e6eaf2" },
              { key: "paid", label: `✓ Paid (${paidCount})`, color: "#4ade80" },
              { key: "unpaid", label: `✗ Unpaid (${unpaidCount})`, color: "#f87171" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === f.key ? "border-current" : "border-white/10 text-gray-500"}`}
                style={filter === f.key ? { color: f.color, background: f.color + "18", borderColor: f.color + "50" } : {}}>
                {f.label}
              </button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search..."
              className="ml-auto bg-[#111827] border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition w-full sm:w-48 mt-2 sm:mt-0" />
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden sm:block bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3 animate-bounce">⏳</div>Loading...
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Tenant", "Unit", "Rent", "Status", "Last Payment", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-gray-600">
                      No tenants found
                    </td></tr>
                  ) : filtered.map((t, i) => {
                    const lastPayment = payments.find(p => p.tenant_id === t.id);
                    return (
                      <tr key={t.id} onClick={() => setSelected(t)}
                        className={`border-b border-white/5 hover:bg-white/3 cursor-pointer transition ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center text-xs font-bold">
                              {t.name?.split(" ").map(n => n[0]).join("") || "?"}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{t.name}</div>
                              <div className="text-xs text-gray-500">{t.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-300">Unit {t.unit || "—"}</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#f0b429]">{fmt(t.rent_amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS[t.status]?.bg} ${STATUS[t.status]?.color}`}>
                            ● {STATUS[t.status]?.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {lastPayment ? new Date(lastPayment.created_at).toLocaleDateString('en-KE') : "No payments yet"}
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <button onClick={() => sendReminder(t)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-400/10 text-blue-400 border border-blue-400/20 font-bold hover:bg-blue-400/20 transition">
                            🔔 Remind
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* MOBILE CARDS */}
          <div className="sm:hidden space-y-3">
            {filtered.map(t => (
              <div key={t.id} onClick={() => setSelected(t)}
                className="bg-[#111827] border border-white/5 rounded-2xl p-4 cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-bold">
                      {t.name?.split(" ").map(n => n[0]).join("") || "?"}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500">Unit {t.unit}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS[t.status]?.bg} ${STATUS[t.status]?.color}`}>
                    ● {STATUS[t.status]?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-lg font-extrabold text-[#f0b429]">{fmt(t.rent_amount)}</div>
                  <button onClick={e => { e.stopPropagation(); sendReminder(t); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-400/10 text-blue-400 border border-blue-400/20 font-bold">
                    🔔 Remind
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* TENANT VIEW MODAL (READ ONLY) */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-extrabold text-lg">
                  {selected.name?.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div className="font-extrabold text-lg">{selected.name}</div>
                  <div className="text-xs text-gray-500">Unit {selected.unit}</div>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS[selected.status]?.bg} ${STATUS[selected.status]?.color}`}>
                ● {STATUS[selected.status]?.label}
              </span>
            </div>

            {[
              ["Phone", selected.phone || "—"],
              ["Monthly Rent", fmt(selected.rent_amount)],
              ["Payment Status", STATUS[selected.status]?.label],
              ["Unit", selected.unit || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-3 border-b border-white/5 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}

            {/* View payment history */}
            <div className="mt-4 mb-4">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Payment History</div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {payments.filter(p => p.tenant_id === selected.id).length === 0 ? (
                  <div className="text-gray-600 text-xs text-center py-4">No payments yet</div>
                ) : payments.filter(p => p.tenant_id === selected.id).map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-[#0d1117] rounded-xl px-3 py-2">
                    <div>
                      <div className="text-xs font-bold text-green-400">{fmt(p.amount)}</div>
                      <div className="text-xs text-gray-500">{p.month}</div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{p.reference}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => sendReminder(selected)}
                className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-400/20 font-extrabold py-3 rounded-xl text-sm hover:bg-blue-500/20 transition">
                🔔 Send Reminder
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                Close
              </button>
            </div>

            {/* READ ONLY notice */}
            <p className="text-center text-gray-600 text-xs mt-3">
              🔒 Payments are processed automatically through M-Pesa
            </p>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnouncement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setShowAnnouncement(false)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-extrabold text-xl mb-6">📢 Send Announcement</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Send To</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "all", label: "All Tenants" },
                    { key: "specific", label: "Specific Tenant" },
                  ].map(t => (
                    <button key={t.key}
                      onClick={() => setAnnouncement(a => ({ ...a, type: t.key }))}
                      className={`py-2 rounded-xl text-sm font-bold border transition-all ${announcement.type === t.key ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]" : "border-white/10 text-gray-400"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {announcement.type === "specific" && (
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Select Tenant</label>
                  <select
                    value={announcement.tenant_id}
                    onChange={e => setAnnouncement(a => ({ ...a, tenant_id: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition">
                    <option value="">Select tenant...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} - Unit {t.unit}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Title</label>
                <input
                  value={announcement.title}
                  onChange={e => setAnnouncement(a => ({ ...a, title: e.target.value }))}
                  placeholder="e.g. Maintenance Notice"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Message</label>
                <textarea
                  value={announcement.message}
                  onChange={e => setAnnouncement(a => ({ ...a, message: e.target.value }))}
                  placeholder="Type your announcement here..."
                  rows={4}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={sendAnnouncement}
                className="flex-1 bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                📢 Send Announcement
              </button>
              <button onClick={() => setShowAnnouncement(false)}
                className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 bg-[#f0b429] text-black font-extrabold px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm z-[100] transition-all duration-300 max-w-xs ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}