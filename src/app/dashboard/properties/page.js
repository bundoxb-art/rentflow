"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Sidebar, { BottomNav } from "@/components/Sidebar";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState("");
  const [newP, setNewP] = useState({ name: "", address: "", units: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => { fetchProperties(); }, []);

  const fetchProperties = async () => {
    setLoading(true);
    const { data: props } = await supabase.from("properties").select("*");
    const { data: tenants } = await supabase.from("tenants").select("*");
    const enriched = (props || []).map(p => ({
      ...p,
      tenants: (tenants || []).filter(t => t.property_id === p.id),
      totalRent: (tenants || []).filter(t => t.property_id === p.id).reduce((s, t) => s + t.rent_amount, 0),
      paidCount: (tenants || []).filter(t => t.property_id === p.id && t.status === "paid").length,
    }));
    setProperties(enriched);
    setLoading(false);
  };

  const addProperty = async () => {
    if (!newP.name) return;
    const { error } = await supabase.from("properties").insert({
      name: newP.name,
      address: newP.address,
    });
    if (error) { showToast("Error: " + error.message); return; }
    setShowAdd(false);
    setNewP({ name: "", address: "", units: "" });
    showToast("✓ Property added!");
    fetchProperties();
  };

  const deleteProperty = async (id) => {
    await supabase.from("properties").delete().eq("id", id);
    showToast("Property removed");
    fetchProperties();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex font-sans">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="sticky top-0 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 px-8 py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-xl font-extrabold">Properties</h1>
            <p className="text-gray-500 text-xs mt-0.5">Manage all your rental properties</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-[#f0b429] text-black font-extrabold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
            + Add Property
          </button>
        </div>

        <div className="px-8 py-6">
          {loading ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-4xl mb-4 animate-bounce">⏳</div>
              <div>Loading properties...</div>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏢</div>
              <div className="text-xl font-bold mb-2">No properties yet</div>
              <div className="text-gray-500 mb-6">Add your first property to get started</div>
              <button onClick={() => setShowAdd(true)} className="bg-[#f0b429] text-black font-extrabold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition">
                + Add First Property
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => {
                const rate = p.tenants.length > 0 ? Math.round((p.paidCount / p.tenants.length) * 100) : 0;
                return (
                  <div key={p.id} className="bg-[#111827] border border-white/5 rounded-2xl p-6 hover:border-[#f0b429]/30 transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-[#f0b429]/10 rounded-xl flex items-center justify-center text-2xl">🏢</div>
                      <button onClick={() => deleteProperty(p.id)} className="text-gray-600 hover:text-red-400 transition text-sm">✕</button>
                    </div>
                    <h3 className="font-extrabold text-lg mb-1">{p.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{p.address || "No address set"}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { label: "Units", value: p.tenants.length },
                        { label: "Paid", value: p.paidCount },
                        { label: "Expected", value: "KSh " + p.totalRent.toLocaleString() },
                        { label: "Rate", value: rate + "%" },
                      ].map((s, i) => (
                        <div key={i} className="bg-[#0d1117] rounded-xl p-3 text-center">
                          <div className="text-sm font-extrabold" style={{ color: s.label === "Rate" ? (rate >= 75 ? "#4ade80" : rate >= 40 ? "#facc15" : "#f87171") : "#f0b429" }}>{s.value}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: rate + "%", background: rate >= 75 ? "#4ade80" : rate >= 40 ? "#facc15" : "#f87171" }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{rate}% collection rate</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ADD PROPERTY MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowAdd(false)}>
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-7 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="font-extrabold text-xl mb-6">Add New Property</div>
            {[
              { key: "name", label: "Property Name", placeholder: "e.g. Sunrise Apartments" },
              { key: "address", label: "Address", placeholder: "e.g. Mombasa Road, Nairobi" },
            ].map(f => (
              <div key={f.key} className="mb-4">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-2">{f.label}</label>
                <input placeholder={f.placeholder} value={newP[f.key]}
                  onChange={e => setNewP(n => ({ ...n, [f.key]: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <button onClick={addProperty} className="flex-1 bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                + Add Property
              </button>
              <button onClick={() => setShowAdd(false)} className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-[#f0b429] text-black font-extrabold px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm z-[100] transition-all duration-300 max-w-xs ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}