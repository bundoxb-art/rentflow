"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ManagerDashboard() {
  const [manager, setManager] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showCreateApartment, setShowCreateApartment] = useState(false);
  const [showCreateSuperAdmin, setShowCreateSuperAdmin] = useState(false);
  const [newApartment, setNewApartment] = useState({ name: "", address: "", city: "Mombasa", description: "", total_units: "" });
  const [newSuperAdmin, setNewSuperAdmin] = useState({ name: "", email: "", phone: "", password: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const fmt = (n) => "KSh " + (n || 0).toLocaleString();

  const checkManager = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign('/manage/login'); return; }

    const { data: mgr } = await supabase
      .from('managers').select('*').eq('email', user.email).single();

    if (!mgr) { window.location.assign('/manage/login'); return; }

    setManager(mgr);
    fetchAll(mgr.id);
  };

  useEffect(() => { checkManager();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async (managerId) => {
    setLoading(true);
    const [
      { data: apts },
      { data: sAdmins },
      { data: allPayments },
      { data: allTenants },
      { data: allLandlords },
    ] = await Promise.all([
      supabase.from('apartments').select('*').eq('manager_id', managerId),
      supabase.from('super_admins').select('*').eq('manager_id', managerId),
      supabase.from('payments').select('amount'),
      supabase.from('tenant_profiles').select('*'),
      supabase.from('landlord_profiles').select('*'),
    ]);

    setApartments(apts || []);
    setSuperAdmins(sAdmins || []);

    const totalRevenue = (allPayments || []).reduce((s, p) => s + (p.amount || 0), 0);

    setStats({
      apartments: (apts || []).length,
      superAdmins: (sAdmins || []).length,
      tenants: (allTenants || []).length,
      landlords: (allLandlords || []).length,
      totalRevenue,
    });

    setLoading(false);
  };

  const createApartment = async () => {
    if (!newApartment.name) { showToast("Enter apartment name"); return; }

    const { error } = await supabase.from('apartments').insert({
      manager_id: manager.id,
      name: newApartment.name,
      address: newApartment.address,
      city: newApartment.city,
      description: newApartment.description,
      total_units: parseInt(newApartment.total_units) || 0,
    });

    if (error) { showToast("Error: " + error.message); return; }

    await supabase.from('audit_logs').insert({
      user_email: manager.email,
      role: 'manager',
      action: 'CREATE_APARTMENT',
      table_name: 'apartments',
      new_data: newApartment
    });

    showToast(`✅ ${newApartment.name} created!`);
    setShowCreateApartment(false);
    setNewApartment({ name: "", address: "", city: "Mombasa", description: "", total_units: "" });
    fetchAll(manager.id);
  };

  const createSuperAdmin = async () => {
    if (!newSuperAdmin.name || !newSuperAdmin.email || !newSuperAdmin.password) {
      showToast("Fill in all fields"); return;
    }

    const res = await fetch('/api/admin/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newSuperAdmin.email,
        password: newSuperAdmin.password,
        full_name: newSuperAdmin.name,
        phone: newSuperAdmin.phone,
        role: 'super_admin',
        extra: { manager_id: manager.id, created_by: manager.email }
      })
    });

    const data = await res.json();
    if (!data.success) { showToast("Error: " + data.message); return; }

    showToast(`✅ Super Admin ${newSuperAdmin.name} created! Share login: ${newSuperAdmin.email}`);
    setShowCreateSuperAdmin(false);
    setNewSuperAdmin({ name: "", email: "", phone: "", password: "" });
    fetchAll(manager.id);
  };

  const tabs = [
    { key: "overview", icon: "📊", label: "Overview" },
    { key: "apartments", icon: "🏢", label: `Apartments (${stats.apartments || 0})` },
    { key: "superadmins", icon: "👑", label: `Super Admins (${stats.superAdmins || 0})` },
    { key: "revenue", icon: "💰", label: "Revenue" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      {/* HEADER */}
      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-extrabold text-[#f0b429]">RentFlow <span className="text-white">Pro</span></div>
            <span className="bg-[#f0b429] text-black text-xs font-bold px-2 py-0.5 rounded-full">🏢 MANAGER</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{manager?.company_name || manager?.full_name}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 hidden sm:block">{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/manage/login'; }}
            className="text-xs text-gray-400 hover:text-red-400 bg-white/5 px-3 py-1.5 rounded-lg transition">
            Sign Out
          </button>
        </div>
      </nav>

      {/* TABS */}
      <div className="flex bg-[#111827] border-b border-white/5 overflow-x-auto sticky top-16 z-10">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-5 py-3 text-xs font-bold flex items-center gap-2 transition border-b-2 ${tab === t.key ? "border-[#f0b429] text-[#f0b429]" : "border-transparent text-gray-500 hover:text-white"}`}>
            {t.icon} <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-br from-[#f0b429]/20 to-transparent border border-[#f0b429]/20 rounded-2xl p-6">
              <div className="text-2xl font-extrabold mb-1">Welcome, {manager?.full_name}! 👔</div>
              <div className="text-gray-400 text-sm">Here's your property portfolio overview</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Apartments", value: stats.apartments || 0, icon: "🏢", color: "#f0b429" },
                { label: "Super Admins", value: stats.superAdmins || 0, icon: "👑", color: "#a78bfa" },
                { label: "Landlords", value: stats.landlords || 0, icon: "🏠", color: "#60a5fa" },
                { label: "Tenants", value: stats.tenants || 0, icon: "👥", color: "#4ade80" },
                { label: "Total Revenue", value: fmt(stats.totalRevenue), icon: "💰", color: "#34d399" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-4" style={{ borderLeft: `3px solid ${s.color}` }}>
                  <div className="flex justify-between mb-2">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                    <span>{s.icon}</span>
                  </div>
                  <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => setShowCreateApartment(true)}
                className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-5 text-left hover:border-[#f0b429]/40 transition">
                <div className="text-3xl mb-3">🏢</div>
                <div className="font-extrabold">Add New Apartment</div>
                <div className="text-gray-500 text-sm mt-1">Register a new property in the system</div>
              </button>
              <button onClick={() => setShowCreateSuperAdmin(true)}
                className="bg-[#111827] border border-purple-500/20 rounded-2xl p-5 text-left hover:border-purple-500/40 transition">
                <div className="text-3xl mb-3">👑</div>
                <div className="font-extrabold">Create Super Admin</div>
                <div className="text-gray-500 text-sm mt-1">Add someone to oversee all apartments</div>
              </button>
            </div>

            {/* Recent Apartments */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
              <div className="font-extrabold text-lg mb-4">🏢 Your Apartments</div>
              {apartments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">🏢</div>
                  No apartments yet. Create your first one!
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {apartments.map(apt => (
                    <div key={apt.id} className="bg-[#0d1117] rounded-2xl p-4 border border-white/5">
                      <div className="font-extrabold mb-1">{apt.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{apt.address}, {apt.city}</div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">{apt.total_units} units</span>
                        <span className={`font-bold ${apt.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                          ● {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* APARTMENTS TAB */}
        {tab === "apartments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold">All Apartments</h2>
              <button onClick={() => setShowCreateApartment(true)}
                className="bg-[#f0b429] text-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition">
                + Add Apartment
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apartments.map(apt => (
                <div key={apt.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-extrabold">{apt.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{apt.address}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${apt.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                      ● {apt.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{apt.description}</div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
                    <span className="text-xs text-gray-500">📍 {apt.city}</span>
                    <span className="text-xs text-[#f0b429] font-bold">{apt.total_units} units</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={async () => {
                      const newStatus = apt.status === 'active' ? 'inactive' : 'active';
                      await supabase.from('apartments').update({ status: newStatus }).eq('id', apt.id);
                      showToast(`${apt.name} ${newStatus}`);
                      fetchAll(manager.id);
                    }}
                      className={`flex-1 text-xs py-2 rounded-xl font-bold border transition ${apt.status === 'active' ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-green-400/10 text-green-400 border-green-400/20'}`}>
                      {apt.status === 'active' ? '🔒 Deactivate' : '✅ Activate'}
                    </button>
                    <button onClick={async () => {
                      await supabase.from('apartments').delete().eq('id', apt.id);
                      showToast(`${apt.name} deleted`);
                      fetchAll(manager.id);
                    }}
                      className="text-xs px-3 py-2 rounded-xl bg-white/5 text-gray-400 font-bold">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUPER ADMINS TAB */}
        {tab === "superadmins" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold">Super Admins</h2>
              <button onClick={() => setShowCreateSuperAdmin(true)}
                className="bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition">
                + Create Super Admin
              </button>
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              {superAdmins.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No super admins yet</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d1117]/50">
                      {["Super Admin", "Email", "Status", "Created", "Actions"].map(h => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {superAdmins.map((sa, i) => (
                      <tr key={sa.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                              {(sa.full_name || "S").charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{sa.full_name}</div>
                              <div className="text-xs text-gray-500">{sa.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">{sa.email}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${sa.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                            ● {sa.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {new Date(sa.created_at).toLocaleDateString('en-KE')}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const s = sa.status === 'active' ? 'suspended' : 'active';
                              await supabase.from('super_admins').update({ status: s }).eq('id', sa.id);
                              showToast(`${sa.full_name} ${s}`);
                              fetchAll(manager.id);
                            }}
                              className={`text-xs px-3 py-1.5 rounded-lg font-bold ${sa.status === 'active' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 'bg-green-400/10 text-green-400 border border-green-400/20'}`}>
                              {sa.status === 'active' ? '🔒 Suspend' : '✅ Activate'}
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
        )}

        {/* REVENUE TAB */}
        {tab === "revenue" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">💰 Revenue Overview</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Revenue", value: fmt(stats.totalRevenue), color: "#4ade80", icon: "💰" },
                { label: "Total Apartments", value: stats.apartments || 0, color: "#f0b429", icon: "🏢" },
                { label: "Total Tenants", value: stats.tenants || 0, color: "#60a5fa", icon: "👥" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-5" style={{ borderLeft: `3px solid ${s.color}` }}>
                  <div className="text-xs text-gray-500 font-bold uppercase mb-2">{s.label}</div>
                  <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Per apartment revenue */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
              <div className="font-extrabold mb-4">Revenue by Apartment</div>
              {apartments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No apartments yet</div>
              ) : apartments.map(apt => (
                <div key={apt.id} className="flex justify-between items-center py-3 border-b border-white/5">
                  <div>
                    <div className="font-bold text-sm">{apt.name}</div>
                    <div className="text-xs text-gray-500">{apt.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-[#f0b429] text-sm">—</div>
                    <div className="text-xs text-gray-500">View details</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE APARTMENT MODAL */}
      {showCreateApartment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setShowCreateApartment(false)}>
          <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-7 w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-extrabold text-xl mb-6">🏢 Add New Apartment</h2>
            <div className="space-y-4">
              {[
                { key: "name", label: "Apartment Name *", placeholder: "e.g. Sunrise Apartments" },
                { key: "address", label: "Address", placeholder: "e.g. 123 Nyali Road" },
                { key: "city", label: "City", placeholder: "e.g. Mombasa" },
                { key: "total_units", label: "Total Units", placeholder: "e.g. 24", type: "number" },
                { key: "description", label: "Description", placeholder: "Brief description..." },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={newApartment[f.key]}
                    onChange={e => setNewApartment(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createApartment}
                className="flex-1 bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                ✅ Create Apartment
              </button>
              <button onClick={() => setShowCreateApartment(false)}
                className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUPER ADMIN MODAL */}
      {showCreateSuperAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setShowCreateSuperAdmin(false)}>
          <div className="bg-[#111827] border border-purple-500/20 rounded-2xl p-7 w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-extrabold text-xl mb-6 text-purple-400">👑 Create Super Admin</h2>
            <div className="space-y-4">
              {[
                { key: "name", label: "Full Name *", placeholder: "Super Admin Name" },
                { key: "email", label: "Email *", placeholder: "superadmin@email.com", type: "email" },
                { key: "phone", label: "Phone", placeholder: "+254 700 000 000" },
                { key: "password", label: "Password *", placeholder: "Min 8 characters", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={newSuperAdmin[f.key]}
                    onChange={e => setNewSuperAdmin(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createSuperAdmin}
                className="flex-1 bg-purple-500 text-white font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                ✅ Create Super Admin
              </button>
              <button onClick={() => setShowCreateSuperAdmin(false)}
                className="flex-1 bg-white/5 text-gray-400 font-extrabold py-3 rounded-xl text-sm">
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