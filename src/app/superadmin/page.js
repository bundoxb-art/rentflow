"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SuperAdminDashboard() {
  const [superAdmin, setSuperAdmin] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [aptAdmins, setAptAdmins] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", phone: "", password: "", apartment_id: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const fmt = (n) => "KSh " + (n || 0).toLocaleString();

  useEffect(() => { checkSuperAdmin(); }, []);

  const checkSuperAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/superadmin/login'; return; }

    const { data: sa } = await supabase
      .from('super_admins').select('*').eq('email', user.email).single();

    if (!sa) { window.location.href = '/superadmin/login'; return; }
    setSuperAdmin(sa);
    fetchAll(sa.manager_id);
  };

  const fetchAll = async (managerId) => {
    setLoading(true);
    const [
      { data: apts },
      { data: admins },
      { data: lands },
      { data: tens },
      { data: pays },
    ] = await Promise.all([
      supabase.from('apartments').select('*').eq('manager_id', managerId),
      supabase.from('apartment_admins').select('*, apartments(name)'),
      supabase.from('landlord_profiles').select('*'),
      supabase.from('tenant_profiles').select('*'),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
    ]);

    setApartments(apts || []);
    setAptAdmins(admins || []);
    setLandlords(lands || []);
    setTenants(tens || []);
    setPayments(pays || []);
    setLoading(false);
  };

  const createApartmentAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !newAdmin.apartment_id) {
      showToast("Fill in all required fields including apartment"); return;
    }

    // Check if apartment already has an admin
    const { data: existing } = await supabase
      .from('apartment_admins').select('id').eq('apartment_id', newAdmin.apartment_id).single();

    if (existing) {
      showToast("This apartment already has an admin. One admin per apartment only!");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: newAdmin.email,
      password: newAdmin.password,
      options: { data: { full_name: newAdmin.name, role: 'apartment_admin' } }
    });

    if (error) { showToast("Error: " + error.message); return; }

    if (data.user) {
      await supabase.from('apartment_admins').insert({
        id: data.user.id,
        super_admin_id: superAdmin.id,
        apartment_id: newAdmin.apartment_id,
        full_name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        created_by: superAdmin.email,
      });

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: newAdmin.name,
        email: newAdmin.email,
        role: 'apartment_admin',
        status: 'approved',
      });
    }

    showToast(`✅ Admin ${newAdmin.name} created!`);
    setShowCreateAdmin(false);
    setNewAdmin({ name: "", email: "", phone: "", password: "", apartment_id: "" });
    fetchAll(superAdmin.manager_id);
  };

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);

  const tabs = [
    { key: "overview", icon: "📊", label: "Overview" },
    { key: "apartments", icon: "🏢", label: `Apartments (${apartments.length})` },
    { key: "admins", icon: "👤", label: `Admins (${aptAdmins.length})` },
    { key: "revenue", icon: "💰", label: "Revenue" },
    { key: "tenants", icon: "🏠", label: `Tenants (${tenants.length})` },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-extrabold text-[#f0b429]">RentFlow <span className="text-white">Pro</span></div>
            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">👑 SUPER ADMIN</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{superAdmin?.full_name}</div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/superadmin/login'; }}
          className="text-xs text-gray-400 hover:text-red-400 bg-white/5 px-3 py-1.5 rounded-lg transition">
          Sign Out
        </button>
      </nav>

      <div className="flex bg-[#111827] border-b border-white/5 overflow-x-auto sticky top-16 z-10">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-5 py-3 text-xs font-bold flex items-center gap-2 transition border-b-2 ${tab === t.key ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-white"}`}>
            {t.icon} <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Apartments", value: apartments.length, color: "#f0b429", icon: "🏢" },
                { label: "Admins", value: aptAdmins.length, color: "#a78bfa", icon: "👤" },
                { label: "Tenants", value: tenants.length, color: "#4ade80", icon: "🏠" },
                { label: "Total Revenue", value: fmt(totalRevenue), color: "#34d399", icon: "💰" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-4" style={{ borderLeft: `3px solid ${s.color}` }}>
                  <div className="flex justify-between mb-2">
                    <div className="text-xs text-gray-500 font-bold uppercase">{s.label}</div>
                    <span>{s.icon}</span>
                  </div>
                  <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowCreateAdmin(true)}
              className="bg-[#111827] border border-purple-500/20 rounded-2xl p-5 text-left hover:border-purple-500/40 transition w-full sm:w-auto">
              <div className="text-3xl mb-2">👤</div>
              <div className="font-extrabold">Assign Apartment Admin</div>
              <div className="text-gray-500 text-sm mt-1">Create admin for a specific apartment</div>
            </button>
          </div>
        )}

        {tab === "apartments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold">All Apartments</h2>
              <button onClick={() => setShowCreateAdmin(true)}
                className="bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition">
                + Assign Admin
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apartments.map(apt => {
                const admin = aptAdmins.find(a => a.apartment_id === apt.id);
                const aptTenants = tenants.filter(t => t.apartment_id === apt.id);
                const aptRevenue = payments.filter(p => p.apartment_id === apt.id).reduce((s, p) => s + (p.amount || 0), 0);

                return (
                  <div key={apt.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                    <div className="font-extrabold mb-1">{apt.name}</div>
                    <div className="text-xs text-gray-500 mb-3">{apt.address}, {apt.city}</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Admin</span>
                        <span className={admin ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                          {admin ? admin.full_name : "No admin assigned"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Tenants</span>
                        <span className="font-bold">{aptTenants.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Revenue</span>
                        <span className="text-[#f0b429] font-bold">{fmt(aptRevenue)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "admins" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold">Apartment Admins</h2>
              <button onClick={() => setShowCreateAdmin(true)}
                className="bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition">
                + Create Admin
              </button>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Admin", "Apartment", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {aptAdmins.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-gray-500">No admins yet</td></tr>
                  ) : aptAdmins.map((a, i) => (
                    <tr key={a.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm">{a.full_name}</div>
                        <div className="text-xs text-gray-500">{a.email}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#f0b429] font-bold">
                        {a.apartments?.name || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${a.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                          ● {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={async () => {
                          const s = a.status === 'active' ? 'suspended' : 'active';
                          await supabase.from('apartment_admins').update({ status: s }).eq('id', a.id);
                          showToast(`${a.full_name} ${s}`);
                          fetchAll(superAdmin.manager_id);
                        }}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold ${a.status === 'active' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 'bg-green-400/10 text-green-400 border border-green-400/20'}`}>
                          {a.status === 'active' ? '🔒 Suspend' : '✅ Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "revenue" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">💰 Revenue Overview</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Total Revenue", value: fmt(totalRevenue), color: "#4ade80" },
                { label: "This Month", value: fmt(payments.filter(p => new Date(p.created_at).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.amount, 0)), color: "#f0b429" },
                { label: "Payments", value: payments.length, color: "#60a5fa" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-5" style={{ borderLeft: `3px solid ${s.color}` }}>
                  <div className="text-xs text-gray-500 font-bold uppercase mb-2">{s.label}</div>
                  <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
              <div className="font-extrabold mb-4">Revenue by Apartment</div>
              {apartments.map(apt => {
                const aptRevenue = payments.filter(p => p.apartment_id === apt.id).reduce((s, p) => s + (p.amount || 0), 0);
                const percentage = totalRevenue > 0 ? (aptRevenue / totalRevenue * 100).toFixed(0) : 0;
                return (
                  <div key={apt.id} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold">{apt.name}</span>
                      <span className="text-[#f0b429] font-extrabold">{fmt(aptRevenue)}</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-2">
                      <div className="bg-[#f0b429] h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{percentage}% of total</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "tenants" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">All Tenants ({tenants.length})</h2>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Tenant", "Email", "Unit", "Status", "Deposit"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t, i) => (
                    <tr key={t.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-5 py-4 font-bold text-sm">{t.full_name || "—"}</td>
                      <td className="px-5 py-4 text-sm text-gray-400">{t.email}</td>
                      <td className="px-5 py-4 text-sm text-gray-300">{t.unit || "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status === 'approved' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                          ● {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.deposit_paid ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                          {t.deposit_paid ? '✅ Paid' : '❌ Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CREATE ADMIN MODAL */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setShowCreateAdmin(false)}>
          <div className="bg-[#111827] border border-purple-500/20 rounded-2xl p-7 w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-extrabold text-xl mb-6 text-purple-400">👤 Create Apartment Admin</h2>
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4">
              <p className="text-yellow-400 text-xs font-bold">⚠️ One admin per apartment only</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Assign to Apartment *</label>
                <select value={newAdmin.apartment_id}
                  onChange={e => setNewAdmin(p => ({ ...p, apartment_id: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition">
                  <option value="">Select apartment...</option>
                  {apartments.map(apt => {
                    const hasAdmin = aptAdmins.some(a => a.apartment_id === apt.id);
                    return (
                      <option key={apt.id} value={apt.id} disabled={hasAdmin}>
                        {apt.name}{hasAdmin ? " (has admin)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              {[
                { key: "name", label: "Full Name *", placeholder: "Admin Name" },
                { key: "email", label: "Email *", placeholder: "admin@email.com", type: "email" },
                { key: "phone", label: "Phone", placeholder: "+254 700 000 000" },
                { key: "password", label: "Password *", placeholder: "Min 8 characters", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={newAdmin[f.key]}
                    onChange={e => setNewAdmin(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createApartmentAdmin}
                className="flex-1 bg-purple-500 text-white font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                ✅ Create Admin
              </button>
              <button onClick={() => setShowCreateAdmin(false)}
                className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm">
                Cancel
              </button>
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