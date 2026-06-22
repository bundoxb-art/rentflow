"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = "bundoxb@gmail.com";

function TenantRequests() {
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    supabase.from("tenant_requests").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setRequests(data || []));
  }, []);

  const approve = async (req) => {
    await supabase.from("tenant_requests").update({ status: "approved" }).eq("id", req.id);
    await supabase.from("profiles").update({ status: "approved" }).eq("id", req.user_id);
    showToast(`✅ ${req.name} approved!`);
    setRequests(r => r.map(x => x.id === req.id ? { ...x, status: "approved" } : x));
  };

  const reject = async (req) => {
    await supabase.from("tenant_requests").update({ status: "rejected" }).eq("id", req.id);
    showToast(`❌ ${req.name} rejected!`);
    setRequests(r => r.map(x => x.id === req.id ? { ...x, status: "rejected" } : x));
  };

  const pending = requests.filter(r => r.status === "pending");

  return (
    <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
      {pending.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No pending tenant requests</div>
      ) : pending.map((req, i) => (
        <div key={req.id} className={`flex items-center justify-between p-5 ${i > 0 ? "border-t border-white/5" : ""}`}>
          <div>
            <div className="font-bold">{req.name}</div>
            <div className="text-xs text-gray-500">{req.email} · Unit {req.unit}</div>
            <div className="text-xs text-gray-600">{req.property_name}</div>
            {req.message && <div className="text-xs text-gray-400 mt-1 italic">"{req.message}"</div>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(req)}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 font-bold">
              ✅ Approve
            </button>
            <button onClick={() => reject(req)}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 font-bold">
              ❌ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const [profiles, setProfiles] = useState([]);
  const [allTenants, setAllTenants] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("pending");
  const router = useRouter();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.assign('/admin/login');
      return;
    }
    if (user.email !== ADMIN_EMAIL) {
      window.location.assign('/dashboard');
      return;
    }
    setUser(user);
    fetchProfiles();
    fetchAllData();
  };

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setProfiles(data || []);
    setLoading(false);
  };

  // Admin fetches ALL data - no landlord_id filter
  const fetchAllData = async () => {
    const { data: allTenants } = await supabase
      .from("tenants")
      .select("*, landlord:landlord_id(email)")
      .order("created_at", { ascending: false });

    const { data: allPayments } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    // Total money across ALL landlords
    const totalMoney = allPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
    
    setAllTenants(allTenants || []);
    setAllPayments(allPayments || []);
    setTotalRevenue(totalMoney);
  };

  const approveUser = async (id, name) => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        status: "approved",
        approved_at: new Date().toISOString()
      })
      .eq("id", id);
    
    if (error) { showToast("Error: " + error.message); return; }
    showToast(`✅ ${name} approved!`);
    fetchProfiles();
  };

  const rejectUser = async (id, name) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", id);
    
    if (error) { showToast("Error: " + error.message); return; }
    showToast(`❌ ${name} rejected!`);
    fetchProfiles();
  };

  const deleteUser = async (id, name) => {
    await supabase.from("profiles").delete().eq("id", id);
    showToast(`🗑️ ${name} deleted!`);
    fetchProfiles();
  };

  const filtered = profiles.filter(p => 
    filter === "all" ? true : p.status === filter
  );

  const pendingCount = profiles.filter(p => p.status === "pending" && p.role === "landlord").length;
  const approvedCount = profiles.filter(p => p.status === "approved").length;
  const tenantCount = profiles.filter(p => p.role === "tenant").length;
  const landlordCount = profiles.filter(p => p.role === "landlord").length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">

      {/* HEADER */}
      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div>
          <div className="text-xl font-extrabold text-[#f0b429]">
            Rent<span className="text-white">Flow</span>
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full ml-2 font-bold">ADMIN</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Admin Control Panel</div>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              {pendingCount} pending approval
            </div>
          )}
          <button onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-400 hover:text-white transition">
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: profiles.length, color: "#f0b429", icon: "👥" },
            { label: "Landlords", value: landlordCount, color: "#4ade80", icon: "🏢" },
            { label: "Tenants", value: tenantCount, color: "#60a5fa", icon: "🏠" },
            { label: "Pending Approval", value: pendingCount, color: "#f87171", icon: "⏳" },
          ].map((s, i) => (
            <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-5"
              style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                <div>{s.icon}</div>
              </div>
              <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* CREATE LANDLORD */}
        <div className="mb-8">
          <Link href="/admin/create-landlord"
            className="bg-[#f0b429] text-black font-extrabold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
            + Create Landlord
          </Link>
        </div>

        {/* TENANT REQUESTS */}
        <div className="mt-8">
          <h2 className="text-lg font-extrabold mb-4">🏠 Tenant Requests</h2>
          <TenantRequests />
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { key: "pending", label: `⏳ Pending (${pendingCount})`, color: "#f87171" },
            { key: "approved", label: `✅ Approved (${approvedCount})`, color: "#4ade80" },
            { key: "rejected", label: `❌ Rejected`, color: "#6b7280" },
            { key: "all", label: `All (${profiles.length})`, color: "#f0b429" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${filter === f.key ? "border-current" : "border-white/10 text-gray-500 hover:text-white"}`}
              style={filter === f.key ? { color: f.color, background: f.color + "18", borderColor: f.color + "50" } : {}}>
              {f.label}
            </button>
          ))}
        </div>

        {/* USERS TABLE */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3 animate-bounce">⏳</div>
              Loading users...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">👥</div>
              No {filter} users found
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-[#0d1117]/50">
                  {["User", "Role", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={`border-b border-white/5 hover:bg-white/3 transition ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-bold text-sm">
                          {(p.full_name || p.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{p.full_name || "—"}</div>
                          <div className="text-xs text-gray-500">{p.email}</div>
                          {p.phone && <div className="text-xs text-gray-600">{p.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${p.role === "landlord" ? "bg-[#f0b429]/10 text-[#f0b429]" : "bg-blue-400/10 text-blue-400"}`}>
                        {p.role === "landlord" ? "🏢 Landlord" : "🏠 Tenant"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        p.status === "approved" ? "bg-green-400/10 text-green-400" :
                        p.status === "pending" ? "bg-yellow-400/10 text-yellow-400" :
                        "bg-red-400/10 text-red-400"
                      }`}>
                        ● {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {p.status === "pending" && p.role === "landlord" && (
                          <button onClick={() => approveUser(p.id, p.full_name)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 transition font-bold">
                            ✅ Approve
                          </button>
                        )}
                        {p.status === "pending" && (
                          <button onClick={() => rejectUser(p.id, p.full_name)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition font-bold">
                            ❌ Reject
                          </button>
                        )}
                        {p.status === "approved" && (
                          <button onClick={() => rejectUser(p.id, p.full_name)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20 transition font-bold">
                            🔒 Suspend
                          </button>
                        )}
                        <button onClick={() => deleteUser(p.id, p.full_name)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:text-red-400 transition font-bold">
                          🗑️
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

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}