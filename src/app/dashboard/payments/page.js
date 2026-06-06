"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Sidebar, { BottomNav } from "@/components/Sidebar";

const fmt = (n) => "KSh " + (n || 0).toLocaleString();

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      window.location.href = '/landlord/login';
      return;
    }
    
    // Fetch ONLY this landlord's tenants
    const { data: t } = await supabase
      .from("tenants")
      .select("*")
      .eq("landlord_id", user.id);
    
    // Fetch ONLY this landlord's payments
    const { data: p } = await supabase
      .from("payments")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false });
    
    setTenants(t || []);
    setPayments(p || []);
    setLoading(false);
  };

  const recordPayment = async (tenant) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("payments").insert({
      tenant_id: tenant.id,
      landlord_id: user.id,
      amount: tenant.rent_amount,
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      method: "mpesa",
      reference: "MP" + Date.now(),
      status: "confirmed"
    });
    if (error) { showToast("Error: " + error.message); return; }
    
    // Only update own tenants
    await supabase
      .from("tenants")
      .update({ status: "paid" })
      .eq("id", tenant.id)
      .eq("landlord_id", user.id);
    
    showToast("✓ Payment recorded for " + tenant.name);
    fetchData();
  };

  const unpaidTenants = tenants.filter(t => t.status !== "paid");
  const totalCollected = tenants.filter(t => t.status === "paid").reduce((s, t) => s + t.rent_amount, 0);
  const totalExpected = tenants.reduce((s, t) => s + t.rent_amount, 0);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex font-sans">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="sticky top-0 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 px-8 py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-xl font-extrabold">Payments</h1>
            <p className="text-gray-500 text-xs mt-0.5">Track and record all rent payments</p>
          </div>
        </div>

        <div className="px-8 py-6">

          {/* Current Date Banner */}
          <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-6 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Today</div>
              <div className="text-lg font-extrabold text-[#f0b429]">
                {new Date().toLocaleDateString('en-KE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Payment Period</div>
              <div className="text-lg font-extrabold">
                {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Expected", value: fmt(totalExpected), color: "#f0b429", icon: "💰" },
              { label: "Total Collected", value: fmt(totalCollected), color: "#4ade80", icon: "✅" },
              { label: "Outstanding", value: fmt(totalExpected - totalCollected), color: "#f87171", icon: "⚠️" },
            ].map((s, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-5" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                  <div className="text-lg">{s.icon}</div>
                </div>
                <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* UNPAID TENANTS */}
          {unpaidTenants.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                <span className="text-red-400">⚠️</span> Unpaid Tenants
                <span className="bg-red-400/10 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-400/20">{unpaidTenants.length}</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {unpaidTenants.map(t => (
                  <div key={t.id} className="bg-[#111827] border border-red-400/20 rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-400/10 text-red-400 flex items-center justify-center font-extrabold text-sm">
                        {t.name?.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{t.name}</div>
                        <div className="text-xs text-gray-500">Unit {t.unit} · {fmt(t.rent_amount)}</div>
                      </div>
                    </div>
                    <button onClick={() => recordPayment(t)}
                      className="bg-green-400 text-black font-extrabold px-4 py-2 rounded-xl text-xs hover:opacity-90 transition">
                      ✓ Mark Paid
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENT HISTORY */}
          <div>
            <h2 className="text-lg font-extrabold mb-4">Payment History</h2>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-4xl mb-3 animate-bounce">⏳</div>
                  Loading payments...
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-4xl mb-3">💳</div>
                  No payments recorded yet
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d1117]/50">
                      {["Tenant", "Month", "Amount", "Method", "Reference", "Status"].map(h => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => {
                      const tenant = tenants.find(t => t.id === p.tenant_id);
                      return (
                        <tr key={p.id} className={`border-b border-white/5 hover:bg-white/3 transition ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-400/10 text-green-400 flex items-center justify-center text-xs font-bold">
                                {tenant?.name?.split(" ").map(n => n[0]).join("") || "?"}
                              </div>
                              <div className="font-bold text-sm">{tenant?.name || "Unknown"}</div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-300">{p.month}</td>
                          <td className="px-5 py-4 text-sm font-extrabold text-green-400">{fmt(p.amount)}</td>
                          <td className="px-5 py-4">
                            <span className="text-xs bg-blue-400/10 text-blue-400 border border-blue-400/20 px-2 py-1 rounded-full font-bold uppercase">{p.method}</span>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500 font-mono">{p.reference}</td>
                          <td className="px-5 py-4">
                            <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-1 rounded-full font-bold">● Confirmed</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* TOAST */}
      <div className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-[#f0b429] text-black font-extrabold px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm z-[100] transition-all duration-300 max-w-xs ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}