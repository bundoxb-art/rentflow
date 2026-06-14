"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ApartmentAdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [apartment, setApartment] = useState(null);
  const [landlords, setLandlords] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [tenantRequests, setTenantRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showCreateLandlord, setShowCreateLandlord] = useState(false);
  const [newLandlord, setNewLandlord] = useState({ name: "", email: "", phone: "", password: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const fmt = (n) => "KSh " + (n || 0).toLocaleString();

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/apartmentadmin/login'; return; }

    const { data: adminData } = await supabase
      .from('apartment_admins')
      .select('*, apartments(*)')
      .eq('email', user.email)
      .single();

    if (!adminData) { window.location.href = '/apartmentadmin/login'; return; }

    setAdmin(adminData);
    setApartment(adminData.apartments);
    fetchAll(adminData.apartment_id, adminData.id);
  };

  const fetchAll = async (apartmentId, adminId) => {
    setLoading(true);
    const [
      { data: lands },
      { data: tens },
      { data: reqs },
      { data: pays },
    ] = await Promise.all([
      supabase.from('landlord_profiles').select('*').eq('apartment_id', apartmentId),
      supabase.from('tenants').select('*').eq('apartment_id', apartmentId),
      supabase.from('tenant_requests').select('*').eq('status', 'pending'),
      supabase.from('payments').select('*').eq('apartment_id', apartmentId).order('created_at', { ascending: false }),
    ]);

    setLandlords(lands || []);
    setTenants(tens || []);
    setTenantRequests(reqs || []);
    setPayments(pays || []);
    setLoading(false);
  };

  const createLandlord = async () => {
    if (!newLandlord.name || !newLandlord.email || !newLandlord.password) {
      showToast("Fill in all required fields"); return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: newLandlord.email,
      password: newLandlord.password,
      options: { data: { full_name: newLandlord.name, role: 'landlord' } }
    });

    if (error) { showToast("Error: " + error.message); return; }

    if (data.user) {
      await supabase.from('landlord_profiles').insert({
        id: data.user.id,
        admin_id: admin.id,
        apartment_id: admin.apartment_id,
        full_name: newLandlord.name,
        email: newLandlord.email,
        phone: newLandlord.phone,
        status: 'approved',
        created_by: admin.email,
      });

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: newLandlord.name,
        email: newLandlord.email,
        role: 'landlord',
        status: 'approved',
      });
    }

    showToast(`✅ Landlord ${newLandlord.name} created!`);
    setShowCreateLandlord(false);
    setNewLandlord({ name: "", email: "", phone: "", password: "" });
    fetchAll(admin.apartment_id, admin.id);
  };

  const approveTenant = async (req) => {
    await supabase.from('tenant_requests').update({ status: 'approved' }).eq('id', req.id);
    await supabase.from('tenant_profiles')
      .update({ 
        status: 'approved',
        apartment_id: admin.apartment_id,
        approved_at: new Date().toISOString()
      })
      .eq('email', req.email);

    // Create the tenant rent record automatically
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('email', req.email)
      .single();

    if (!existingTenant) {
      await supabase.from('tenants').insert({
        name: req.name,
        email: req.email,
        phone: req.phone,
        unit: req.unit,
        status: 'unpaid',
        apartment_id: admin.apartment_id,
        landlord_id: null,
        rent_amount: 0,
      });
    }

    showToast(`✅ ${req.name} approved! They can now access their portal.`);
    fetchAll(admin.apartment_id, admin.id);
  };

  const rejectTenant = async (req) => {
    await supabase.from('tenant_requests').update({ status: 'rejected' }).eq('id', req.id);
    await supabase.from('tenant_profiles').update({ status: 'rejected' }).eq('email', req.email);
    showToast(`❌ ${req.name} rejected`);
    fetchAll(admin.apartment_id, admin.id);
  };

  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpected = tenants.reduce((s, t) => s + (t.rent_amount || 0), 0);
  const paidCount = tenants.filter(t => t.status === 'paid').length;
  const collectionRate = totalExpected > 0 ? Math.round((totalRevenue / totalExpected) * 100) : 0;

  const tabs = [
    { key: "overview", icon: "📊", label: "Overview" },
    { key: "landlords", icon: "🏢", label: `Landlords (${landlords.length})` },
    { key: "tenants", icon: "🏠", label: `Tenants (${tenants.length})` },
    { key: "requests", icon: "⏳", label: `Requests (${tenantRequests.length})` },
    { key: "payments", icon: "💳", label: "Payments" },
    { key: "reports", icon: "📄", label: "Reports" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-extrabold text-[#f0b429]">RentFlow <span className="text-white">Pro</span></div>
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">🏛️ ADMIN</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{apartment?.name} · {admin?.full_name}</div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/apartmentadmin/login'; }}
          className="text-xs text-gray-400 hover:text-red-400 bg-white/5 px-3 py-1.5 rounded-lg transition">
          Sign Out
        </button>
      </nav>

      <div className="flex bg-[#111827] border-b border-white/5 overflow-x-auto sticky top-16 z-10">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-bold flex items-center gap-1.5 transition border-b-2 ${tab === t.key ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-white"}`}>
            {t.icon} <span className="hidden sm:block">{t.label}</span>
            {t.key === "requests" && tenantRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center ml-1">
                {tenantRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {tab === "overview" && (
          <div className="space-y-6">
            {/* Apartment Banner */}
            <div className="bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/20 rounded-2xl p-6">
              <div className="text-2xl font-extrabold mb-1">{apartment?.name} 🏛️</div>
              <div className="text-gray-400 text-sm">{apartment?.address}, {apartment?.city}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Expected", value: fmt(totalExpected), color: "#f0b429", icon: "💰" },
                { label: "Collected", value: fmt(totalRevenue), color: "#4ade80", icon: "✅" },
                { label: "Collection Rate", value: `${collectionRate}%`, color: collectionRate >= 75 ? "#4ade80" : "#f87171", icon: "📊" },
                { label: "Paid Tenants", value: `${paidCount}/${tenants.length}`, color: "#60a5fa", icon: "🏠" },
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

            {tenantRequests.length > 0 && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-red-400">⏳ Pending Tenant Requests</div>
                  <div className="text-gray-400 text-sm">{tenantRequests.length} tenant(s) waiting for approval</div>
                </div>
                <button onClick={() => setTab('requests')}
                  className="bg-red-400 text-black font-bold px-4 py-2 rounded-xl text-sm">
                  Review Now →
                </button>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <button onClick={() => setShowCreateLandlord(true)}
                className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-5 text-left hover:border-[#f0b429]/40 transition">
                <div className="text-3xl mb-2">🏢</div>
                <div className="font-extrabold">Create Landlord</div>
                <div className="text-gray-500 text-sm mt-1">Add a landlord to {apartment?.name}</div>
              </button>
              <button onClick={() => setTab('reports')}
                className="bg-[#111827] border border-blue-500/20 rounded-2xl p-5 text-left hover:border-blue-500/40 transition">
                <div className="text-3xl mb-2">📄</div>
                <div className="font-extrabold">Generate Report</div>
                <div className="text-gray-500 text-sm mt-1">Monthly & yearly financial reports</div>
              </button>
            </div>
          </div>
        )}

        {tab === "landlords" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold">Landlords — {apartment?.name}</h2>
              <button onClick={() => setShowCreateLandlord(true)}
                className="bg-[#f0b429] text-black font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition">
                + Create Landlord
              </button>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              {landlords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No landlords yet for this apartment</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d1117]/50">
                      {["Landlord", "Email", "Phone", "Status", "Actions"].map(h => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {landlords.map((l, i) => (
                      <tr key={l.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-bold text-sm">
                              {(l.full_name || "L").charAt(0)}
                            </div>
                            <div className="font-bold text-sm">{l.full_name}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">{l.email}</td>
                        <td className="px-5 py-4 text-sm text-gray-400">{l.phone || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.status === 'approved' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                            ● {l.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const s = l.status === 'approved' ? 'suspended' : 'approved';
                              await supabase.from('landlord_profiles').update({ status: s }).eq('id', l.id);
                              showToast(`${l.full_name} ${s}`);
                              fetchAll(admin.apartment_id, admin.id);
                            }}
                              className={`text-xs px-3 py-1.5 rounded-lg font-bold ${l.status === 'approved' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 'bg-green-400/10 text-green-400 border border-green-400/20'}`}>
                              {l.status === 'approved' ? '🔒 Suspend' : '✅ Activate'}
                            </button>
                            <button onClick={async () => {
                              await supabase.from('landlord_profiles').delete().eq('id', l.id);
                              showToast("Landlord deleted");
                              fetchAll(admin.apartment_id, admin.id);
                            }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 font-bold">
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
        )}

        {tab === "tenants" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Tenants — {apartment?.name}</h2>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              {tenants.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No tenants yet</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d1117]/50">
                      {["Tenant", "Unit", "Rent", "Status", "Actions"].map(h => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t, i) => (
                      <tr key={t.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-4">
                          <div className="font-bold text-sm">{t.name}</div>
                          <div className="text-xs text-gray-500">{t.phone}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-300">Unit {t.unit}</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#f0b429]">{fmt(t.rent_amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status === 'paid' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                            ● {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={async () => {
                            await supabase.from('tenants').delete().eq('id', t.id);
                            showToast("Tenant deleted");
                            fetchAll(admin.apartment_id, admin.id);
                          }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 font-bold">
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "requests" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Tenant Requests ⏳</h2>
            {tenantRequests.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">✅</div>
                No pending tenant requests
              </div>
            ) : tenantRequests.map((req, i) => (
              <div key={req.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-extrabold text-lg">{req.name}</div>
                    <div className="text-xs text-gray-500">{req.email} · {req.phone}</div>
                  </div>
                  <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs font-bold px-2 py-1 rounded-full">
                    ⏳ Pending
                  </span>
                </div>
                {[
                  ["Unit Requested", req.unit],
                  ["Property", req.property_name],
                  ["Message", req.message],
                  ["Applied", new Date(req.created_at).toLocaleDateString('en-KE')],
                ].map(([k, v]) => v && (
                  <div key={k} className="flex justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-bold text-sm">{v}</span>
                  </div>
                ))}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => approveTenant(req)}
                    className="flex-1 bg-green-400/10 text-green-400 border border-green-400/20 font-extrabold py-3 rounded-xl text-sm hover:bg-green-400/20 transition">
                    ✅ Approve
                  </button>
                  <button onClick={() => rejectTenant(req)}
                    className="flex-1 bg-red-400/10 text-red-400 border border-red-400/20 font-extrabold py-3 rounded-xl text-sm hover:bg-red-400/20 transition">
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold">Payments — {apartment?.name}</h2>
              <div className="text-sm font-bold text-green-400">Total: {fmt(totalRevenue)}</div>
            </div>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Tenant", "Amount", "Month", "Method", "Reference", "Date"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-500">No payments yet</td></tr>
                  ) : payments.map((p, i) => {
                    const tenant = tenants.find(t => t.id === p.tenant_id);
                    return (
                      <tr key={p.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-4 text-sm font-bold">{tenant?.name || "—"}</td>
                        <td className="px-5 py-4 text-sm font-extrabold text-green-400">{fmt(p.amount)}</td>
                        <td className="px-5 py-4 text-sm text-gray-300">{p.month}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full font-bold uppercase">{p.method}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 font-mono">{p.reference}</td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {new Date(p.created_at).toLocaleDateString('en-KE')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">📄 Financial Reports</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Monthly Report */}
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
                <div className="font-extrabold text-lg mb-4">📅 Monthly Report</div>
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    const monthPayments = payments.filter(p => p.month === monthName);
                    const monthTotal = monthPayments.reduce((s, p) => s + (p.amount || 0), 0);
                    return (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-sm text-gray-300">{monthName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#f0b429]">{fmt(monthTotal)}</span>
                          <button onClick={() => {
                            const report = `RENTFLOW - MONTHLY REPORT\n\nApartment: ${apartment?.name}\nMonth: ${monthName}\nTotal Collected: ${fmt(monthTotal)}\nPayments: ${monthPayments.length}\n\nGenerated: ${new Date().toLocaleString('en-KE')}`;
                            const blob = new Blob([report], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Report-${monthName}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            showToast("✅ Report downloaded!");
                          }}
                            className="text-xs px-2 py-1 rounded-lg bg-[#f0b429]/10 text-[#f0b429] font-bold">
                            ⬇️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
                <div className="font-extrabold text-lg mb-4">📊 Summary</div>
                {[
                  ["Apartment", apartment?.name],
                  ["Total Units", apartment?.total_units],
                  ["Total Landlords", landlords.length],
                  ["Total Tenants", tenants.length],
                  ["Paid This Month", `${paidCount} tenants`],
                  ["Collection Rate", `${collectionRate}%`],
                  ["Total Revenue", fmt(totalRevenue)],
                  ["Report Date", new Date().toLocaleDateString('en-KE')],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-white/5 text-sm">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE LANDLORD MODAL */}
      {showCreateLandlord && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4"
          onClick={() => setShowCreateLandlord(false)}>
          <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-7 w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <h2 className="font-extrabold text-xl mb-6">🏢 Create Landlord</h2>
            <div className="bg-blue-400/10 border border-blue-400/20 rounded-xl p-3 mb-4">
              <p className="text-blue-400 text-xs font-bold">📍 Apartment: {apartment?.name}</p>
            </div>
            <div className="space-y-4">
              {[
                { key: "name", label: "Full Name *", placeholder: "Landlord Name" },
                { key: "email", label: "Email *", placeholder: "landlord@email.com", type: "email" },
                { key: "phone", label: "Phone", placeholder: "+254 700 000 000" },
                { key: "password", label: "Password *", placeholder: "Min 8 characters", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={newLandlord[f.key]}
                    onChange={e => setNewLandlord(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createLandlord}
                className="flex-1 bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition">
                ✅ Create Landlord
              </button>
              <button onClick={() => setShowCreateLandlord(false)}
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