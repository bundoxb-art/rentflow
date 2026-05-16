"use client";
import Link from "next/link";
import { useState, useEffect, useSuppressHydrationWarning } from "react";
import { supabase } from "@/lib/supabase";

const STATUS = {
  paid: { label: "Paid", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  unpaid: { label: "Unpaid", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  partial: { label: "Partial", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
};

const fmt = (n) => "KSh " + (n || 0).toLocaleString();

export default function Dashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [newT, setNewT] = useState({ name: "", unit: "", property: "", rent_amount: "", phone: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // Load tenants from Supabase
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Give it a second chance
        await new Promise(resolve => setTimeout(resolve, 1000))
        const { data: { session: session2 } } = await supabase.auth.getSession()
        if (!session2) {
          window.location.href = '/auth'
          return
        }
      }
      fetchTenants()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        fetchTenants()
      }
      if (event === 'SIGNED_OUT') {
        window.location.href = '/auth'
      }
    })

    const realtimeSub = supabase
      .channel('realtime-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tenants' },
        () => fetchTenants()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(realtimeSub)
    }
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tenants").select("*");
    if (error) { console.error(error); showToast("Error loading tenants"); }
    else setTenants(data || []);
    setLoading(false);
  };

  const markPaid = async (id) => {
    const { error } = await supabase.from("tenants").update({ status: "paid" }).eq("id", id);
    if (error) { showToast("Error updating payment"); return; }
    await supabase.from("payments").insert({
      tenant_id: id,
      amount: tenants.find(t => t.id === id)?.rent_amount,
      month: "May 2025",
      method: "manual",
      reference: "MAN" + Date.now(),
      status: "confirmed"
    });
    setSelected(null);
    showToast("✓ Payment recorded!");
    fetchTenants();
  };

  const addTenant = async () => {
    if (!newT.name || !newT.rent_amount) {
      showToast("Please fill in name and rent amount!");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("tenants")
        .insert({
          name: newT.name,
          unit: newT.unit || "",
          phone: newT.phone || "",
          rent_amount: parseInt(newT.rent_amount),
          status: "unpaid",
        })
        .select();

      if (error) {
        console.error("Add tenant error:", error);
        showToast("Error: " + error.message);
        return;
      }

      setShowAdd(false);
      setNewT({ name: "", unit: "", property: "", rent_amount: "", phone: "" });
      showToast("✓ Tenant added successfully!");
      fetchTenants();
    } catch (err) {
      console.error("Unexpected error:", err);
      showToast("Error adding tenant. Please try again.");
    }
  };

  const sendReminder = (t) => {
    setSelected(null);
    showToast(`📱 Reminder sent to ${t.name}`);
  };

  const filtered = tenants.filter(t => {
    const matchF = filter === "all" || t.status === filter;
    const matchS = t.name?.toLowerCase().includes(search.toLowerCase()) || t.unit?.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const totalRent = tenants.reduce((s, t) => s + (t.rent_amount || 0), 0);
  const totalPaid = tenants.filter(t => t.status === "paid").reduce((s, t) => s + (t.rent_amount || 0), 0);
  const rate = totalRent > 0 ? Math.round((totalPaid / totalRent) * 100) : 0;
  const paidCount = tenants.filter(t => t.status === "paid").length;
  const unpaidCount = tenants.filter(t => t.status === "unpaid").length;
  const partialCount = tenants.filter(t => t.status === "partial").length;

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex font-sans">
        <aside className="w-60 bg-[#111827] border-r border-white/5 flex flex-col py-6 flex-shrink-0">
          <div className="px-6 mb-8">
            <div className="text-xl font-extrabold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>
          </div>
        </aside>
        <main className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/5 rounded-xl w-64" />
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
            </div>
            <div className="h-64 bg-white/5 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex font-sans">

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-60" : "w-16"} transition-all duration-300 bg-[#111827] border-r border-white/5 flex flex-col py-6 flex-shrink-0`}>
        <div className="px-4 mb-8 flex items-center justify-between">
          {sidebarOpen && <div className="text-xl font-extrabold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-white transition ml-auto">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-2 flex-1">
          {[
            { icon: "📊", label: "Dashboard", href: "/dashboard", active: true },
            { icon: "🏢", label: "Properties", href: "/dashboard/properties" },
            { icon: "👥", label: "Tenants", href: "/dashboard/tenants" },
            { icon: "💳", label: "Payments", href: "/dashboard/payments" },
            { icon: "🔔", label: "Reminders", href: "/dashboard/reminders" },
            { icon: "📄", label: "Reports", href: "/dashboard/reports" },
            { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
          ].map((n, i) => (
            <Link key={i} href={n.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${n.active ? "bg-[#f0b429]/10 text-[#f0b429]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              <span className="text-lg flex-shrink-0">{n.icon}</span>
              {sidebarOpen && <span>{n.label}</span>}
            </Link>
          ))}
        </nav>
        {sidebarOpen && (
          <div className="px-4 mt-4">
            <div className="bg-[#0d1117] rounded-2xl p-4 border border-white/5">
              <div className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Collection Rate</div>
              <div className={`text-2xl font-extrabold ${rate >= 75 ? "text-green-400" : rate >= 40 ? "text-yellow-400" : "text-red-400"}`}>{rate}%</div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${rate >= 75 ? "bg-green-400" : rate >= 40 ? "bg-yellow-400" : "bg-red-400"}`} style={{ width: rate + "%" }} />
              </div>
              <div className="text-xs text-gray-600 mt-2">May 2025</div>
            </div>
          </div>
        )}
        <div className={`px-4 mt-4 flex items-center gap-3 ${!sidebarOpen && "justify-center"}`}>
          <div className="w-8 h-8 rounded-full bg-[#f0b429] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
            {(user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && <div><div className="text-sm font-bold text-white">{user?.user_metadata?.full_name || user?.email || "Landlord"}</div><div className="text-xs text-gray-500">{user?.user_metadata?.role || "Landlord"}</div></div>}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 px-8 py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-xl font-extrabold">Good morning, {user?.user_metadata?.full_name || user?.email || "there"} 👋</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {typeof window !== 'undefined' ? new Date().toLocaleDateString('en-KE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : ''} · Here&apos;s your rent overview
            </p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-[#f0b429] text-black font-extrabold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
            + Add Tenant
          </button>
        </div>

        <div className="px-8 py-6">
          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Expected", value: fmt(totalRent), sub: `${tenants.length} tenants`, accent: "#f0b429", icon: "💰" },
              { label: "Collected", value: fmt(totalPaid), sub: `${paidCount} fully paid`, accent: "#4ade80", icon: "✅" },
              { label: "Outstanding", value: fmt(totalRent - totalPaid), sub: `${unpaidCount + partialCount} pending`, accent: "#f87171", icon: "⚠️" },
              { label: "Partial Payments", value: partialCount, sub: "Balance remaining", accent: "#facc15", icon: "◑" },
            ].map((s, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-5" style={{ borderLeft: `3px solid ${s.accent}` }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                  <div className="text-lg">{s.icon}</div>
                </div>
                <div className="text-2xl font-extrabold" style={{ color: s.accent }}>{s.value}</div>
                <div className="text-xs text-gray-600 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* FILTER + SEARCH */}
          <div className="flex flex-wrap gap-3 mb-5 items-center">
            {[
              { key: "all", label: `All (${tenants.length})`, color: "#e6eaf2" },
              { key: "paid", label: `✓ Paid (${paidCount})`, color: "#4ade80" },
              { key: "unpaid", label: `✗ Unpaid (${unpaidCount})`, color: "#f87171" },
              { key: "partial", label: `◑ Partial (${partialCount})`, color: "#facc15" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${filter === f.key ? "border-current" : "border-white/10 text-gray-500 hover:text-white"}`}
                style={filter === f.key ? { color: f.color, background: f.color + "18", borderColor: f.color + "50" } : {}}>
                {f.label}
              </button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search tenant or unit..."
              className="ml-auto bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition w-56" />
          </div>

          {/* TABLE */}
          <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-4xl mb-4 animate-bounce">⏳</div>
                <div>Loading tenants from database...</div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Tenant", "Unit", "Rent", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-16 text-gray-600">
                      {tenants.length === 0 ? "No tenants yet — add your first tenant!" : "No tenants match your search"}
                    </td></tr>
                  ) : filtered.map((t, i) => (
                    <tr key={t.id} onClick={() => setSelected(t)}
                      className={`border-b border-white/5 hover:bg-white/3 cursor-pointer transition ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center text-xs font-bold flex-shrink-0">
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
                          ● {STATUS[t.status]?.label || t.status}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {t.status !== "paid" && (
                            <button onClick={() => markPaid(t.id)} className="text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition font-bold">
                              Mark Paid
                            </button>
                          )}
                          <button onClick={() => sendReminder(t)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:text-white transition font-bold">
                            Remind
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* TENANT DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setSelected(null)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-extrabold">
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
              ["Status", STATUS[selected.status]?.label],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-3 border-b border-white/5 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              {selected.status !== "paid" && (
                <button onClick={() => markPaid(selected.id)} className="flex-1 bg-green-400 text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                  ✓ Mark as Paid
                </button>
              )}
              {selected.status !== "paid" && selected.phone && (
                <button 
                  onClick={async () => {
                    showToast("📱 Sending M-Pesa prompt...");
                    const res = await fetch('/api/mpesa/stk-push', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        phone: selected.phone,
                        amount: selected.rent_amount,
                        tenantId: selected.id,
                        tenantName: selected.name,
                      })
                    });
                    const data = await res.json();
                    showToast(data.success ? "📱 " + data.message : "❌ " + data.message);
                    setSelected(null);
                  }}
                  className="flex-1 bg-green-400 text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                  📱 Send M-Pesa
                </button>
              )}
              <button onClick={() => sendReminder(selected)} className="flex-1 bg-blue-500/10 text-blue-400 border border-blue-400/20 font-extrabold py-3 rounded-xl text-sm hover:bg-blue-500/20 transition">
                📱 Send Reminder
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TENANT MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowAdd(false)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="font-extrabold text-xl mb-6">Add New Tenant</div>
            {[
              { key: "name", label: "Full Name", placeholder: "e.g. John Doe" },
              { key: "unit", label: "Unit Number", placeholder: "e.g. A3" },
              { key: "rent_amount", label: "Monthly Rent (KSh)", placeholder: "e.g. 15000", type: "number" },
              { key: "phone", label: "Phone Number", placeholder: "e.g. +254 700 000 000" },
            ].map(f => (
              <div key={f.key} className="mb-4">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{f.label}</label>
                <input type={f.type || "text"} placeholder={f.placeholder}
                  value={newT[f.key]}
                  onChange={e => setNewT(n => ({ ...n, [f.key]: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <button onClick={addTenant} className="flex-1 bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                + Add Tenant
              </button>
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                Cancel
              </button>
            </div>
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