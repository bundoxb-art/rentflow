"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  'https://vrelkjytegukqxgustmj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'
)

const fmt = (n) => "KSh " + (n || 0).toLocaleString();
const STATUS = {
  paid: { label: "Paid", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  unpaid: { label: "Unpaid", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  partial: { label: "Partial", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
};

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { fetchTenants(); }, []);

  const fetchTenants = async () => {
    setLoading(true);
    const { data } = await supabase.from("tenants").select("*");
    setTenants(data || []);
    setLoading(false);
  };

  const markPaid = async (id) => {
    await supabase.from("tenants").update({ status: "paid" }).eq("id", id);
    setSelected(null);
    showToast("✓ Marked as paid!");
    fetchTenants();
  };

  const deleteTenant = async (id) => {
    await supabase.from("tenants").delete().eq("id", id);
    setSelected(null);
    showToast("Tenant removed");
    fetchTenants();
  };

  const filtered = tenants.filter(t => {
    const matchF = filter === "all" || t.status === filter;
    const matchS = t.name?.toLowerCase().includes(search.toLowerCase()) || t.unit?.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const paidCount = tenants.filter(t => t.status === "paid").length;
  const unpaidCount = tenants.filter(t => t.status === "unpaid").length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex">
      <aside className="w-60 bg-[#111827] border-r border-white/5 flex flex-col py-6 flex-shrink-0">
        <div className="px-6 mb-8">
          <div className="text-xl font-extrabold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>
        </div>
        <nav className="flex flex-col gap-1 px-2 flex-1">
          {[
            { icon: "📊", label: "Dashboard", href: "/dashboard" },
            { icon: "🏢", label: "Properties", href: "/dashboard/properties" },
            { icon: "👥", label: "Tenants", href: "/dashboard/tenants", active: true },
            { icon: "💳", label: "Payments", href: "/dashboard/payments" },
            { icon: "🔔", label: "Reminders", href: "/dashboard/reminders" },
            { icon: "📄", label: "Reports", href: "/dashboard/reports" },
            { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
          ].map((n, i) => (
            <Link key={i} href={n.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${n.active ? "bg-[#f0b429]/10 text-[#f0b429]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              <span className="text-lg">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 px-8 py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-xl font-extrabold">Tenants</h1>
            <p className="text-gray-500 text-xs mt-0.5">Manage all your tenants</p>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Tenants", value: tenants.length, color: "#f0b429" },
              { label: "Paid", value: paidCount, color: "#4ade80" },
              { label: "Unpaid", value: unpaidCount, color: "#f87171" },
            ].map((s, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-5 text-center">
                <div className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-3 mb-5 items-center">
            {[
              { key: "all", label: `All (${tenants.length})`, color: "#e6eaf2" },
              { key: "paid", label: `✓ Paid (${paidCount})`, color: "#4ade80" },
              { key: "unpaid", label: `✗ Unpaid (${unpaidCount})`, color: "#f87171" },
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

          {/* TENANT CARDS */}
          {loading ? (
            <div className="text-center py-20 text-gray-500"><div className="text-4xl mb-3 animate-bounce">⏳</div>Loading...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(t => (
                <div key={t.id} onClick={() => setSelected(t)}
                  className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-[#f0b429]/30 cursor-pointer transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-extrabold">
                        {t.name?.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-bold">{t.name}</div>
                        <div className="text-xs text-gray-500">Unit {t.unit || "—"}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS[t.status]?.bg} ${STATUS[t.status]?.color}`}>
                      ● {STATUS[t.status]?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly Rent</span>
                    <span className="font-extrabold text-[#f0b429]">{fmt(t.rent_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-300">{t.phone || "—"}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-16 text-gray-600">No tenants found</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* TENANT MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setSelected(null)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-extrabold text-xl">
                {selected.name?.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="font-extrabold text-xl">{selected.name}</div>
                <div className="text-gray-500 text-sm">Unit {selected.unit}</div>
              </div>
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
                <button onClick={() => markPaid(selected.id)} className="flex-1 bg-green-400 text-black font-extrabold py-3 rounded-xl text-sm">✓ Mark Paid</button>
              )}
              <button onClick={() => deleteTenant(selected.id)} className="flex-1 bg-red-400/10 text-red-400 border border-red-400/20 font-extrabold py-3 rounded-xl text-sm">🗑 Remove</button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}