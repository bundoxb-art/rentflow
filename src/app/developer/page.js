"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const DEVELOPER_EMAIL = "bundoxb@gmail.com";

export default function DeveloperPanel() {
  const [stats, setStats] = useState({});
  const [admins, setAdmins] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState("overview");
  const [editSetting, setEditSetting] = useState(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", phone: "", password: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    checkDeveloper();
  }, []);

  const checkDeveloper = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== DEVELOPER_EMAIL) {
      window.location.href = '/';
      return;
    }
    fetchAll();
  };

  const fetchAll = async () => {
    setLoading(true);

    const [
      { data: adminData },
      { data: landlordData },
      { data: tenantData },
      { data: paymentData },
      { data: depositData },
      { data: settingData },
      { data: logData },
    ] = await Promise.all([
      supabase.from('admin_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('landlord_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('tenant_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('deposits').select('*').order('created_at', { ascending: false }),
      supabase.from('system_settings').select('*'),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    setAdmins(adminData || []);
    setLandlords(landlordData || []);
    setTenants(tenantData || []);
    setPayments(paymentData || []);
    setDeposits(depositData || []);
    setSettings(settingData || []);
    setLogs(logData || []);

    const totalRevenue = (paymentData || []).reduce((s, p) => s + (p.amount || 0), 0);
    const totalDeposits = (depositData || []).filter(d => d.status === 'confirmed').reduce((s, d) => s + (d.amount || 0), 0);

    setStats({
      admins: (adminData || []).length,
      landlords: (landlordData || []).length,
      tenants: (tenantData || []).length,
      payments: (paymentData || []).length,
      totalRevenue,
      totalDeposits,
      pendingDeposits: (depositData || []).filter(d => d.status === 'pending').length,
    });

    setLoading(false);
  };

  const updateSetting = async (key, value) => {
    await supabase.from('system_settings')
      .update({ value, updated_at: new Date().toISOString(), updated_by: DEVELOPER_EMAIL })
      .eq('key', key);
    showToast(`✅ ${key} updated!`);
    setEditSetting(null);
    fetchAll();
  };

  const createAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      showToast("Fill in all fields");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: newAdmin.email,
      password: newAdmin.password,
      options: {
        data: { full_name: newAdmin.name, phone: newAdmin.phone, role: 'admin' }
      }
    });

    if (error) { showToast("Error: " + error.message); return; }

    if (data.user) {
      await supabase.from('admin_profiles').insert({
        id: data.user.id,
        full_name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        status: 'active',
        created_by: DEVELOPER_EMAIL,
      });
    }

    showToast(`✅ Admin ${newAdmin.name} created!`);
    setNewAdmin({ name: "", email: "", phone: "", password: "" });
    setShowCreateAdmin(false);
    fetchAll();
  };

  const confirmDeposit = async (depositId, tenantUserId) => {
    await supabase.from('deposits')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), confirmed_by: DEVELOPER_EMAIL })
      .eq('id', depositId);

    await supabase.from('tenant_profiles')
      .update({ status: 'approved' })
      .eq('id', tenantUserId);

    showToast("✅ Deposit confirmed!");
    fetchAll();
  };

  const fmt = (n) => "KSh " + (n || 0).toLocaleString();

  const tabs = [
    { key: "overview", icon: "📊", label: "Overview" },
    { key: "admins", icon: "👤", label: `Admins (${stats.admins || 0})` },
    { key: "landlords", icon: "🏢", label: `Landlords (${stats.landlords || 0})` },
    { key: "tenants", icon: "🏠", label: `Tenants (${stats.tenants || 0})` },
    { key: "deposits", icon: "💰", label: `Deposits (${stats.pendingDeposits || 0} pending)` },
    { key: "payments", icon: "💳", label: "Payments" },
    { key: "settings", icon: "⚙️", label: "Settings" },
    { key: "logs", icon: "📋", label: "Audit Logs" },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">

      {/* HEADER */}
      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-xl font-extrabold text-[#f0b429]">
              Rent<span className="text-white">Flow</span>
            </div>
            <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              👨‍💻 DEVELOPER
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Super Admin Control Center</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 hidden sm:block">
            {new Date().toLocaleString('en-KE')}
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}
            className="text-xs text-gray-400 hover:text-red-400 transition bg-white/5 px-3 py-1.5 rounded-lg">
            Sign Out
          </button>
        </div>
      </nav>

      {/* TABS */}
      <div className="flex bg-[#111827] border-b border-white/5 overflow-x-auto sticky top-16 z-10">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-bold flex items-center gap-1.5 transition border-b-2 ${tab === t.key ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-white"}`}>
            <span>{t.icon}</span>
            <span className="hidden sm:block">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Admins", value: stats.admins || 0, color: "#a78bfa", icon: "👤" },
                { label: "Total Landlords", value: stats.landlords || 0, color: "#f0b429", icon: "🏢" },
                { label: "Total Tenants", value: stats.tenants || 0, color: "#4ade80", icon: "🏠" },
                { label: "Total Revenue", value: fmt(stats.totalRevenue), color: "#34d399", icon: "💰" },
                { label: "Total Deposits", value: fmt(stats.totalDeposits), color: "#60a5fa", icon: "💳" },
                { label: "Pending Deposits", value: stats.pendingDeposits || 0, color: "#f87171", icon: "⏳" },
                { label: "Total Payments", value: stats.payments || 0, color: "#4ade80", icon: "✅" },
                { label: "System Status", value: "✅ Online", color: "#4ade80", icon: "🌐" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-4"
                  style={{ borderLeft: `3px solid ${s.color}` }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                    <div>{s.icon}</div>
                  </div>
                  <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
              <h2 className="font-extrabold text-lg mb-4">⚡ Quick Actions</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <button onClick={() => setShowCreateAdmin(true)}
                  className="bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl p-4 text-left hover:bg-purple-500/20 transition">
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-bold text-sm">Create Admin</div>
                  <div className="text-xs text-gray-500">Add new admin account</div>
                </button>
                <button onClick={() => setTab('settings')}
                  className="bg-[#f0b429]/10 text-[#f0b429] border border-[#f0b429]/20 rounded-xl p-4 text-left hover:bg-[#f0b429]/20 transition">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-bold text-sm">M-Pesa Settings</div>
                  <div className="text-xs text-gray-500">Update Till/Paybill</div>
                </button>
                <button onClick={() => setTab('deposits')}
                  className="bg-green-400/10 text-green-400 border border-green-400/20 rounded-xl p-4 text-left hover:bg-green-400/20 transition">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-bold text-sm">Confirm Deposits</div>
                  <div className="text-xs text-gray-500">{stats.pendingDeposits || 0} pending</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMINS */}
        {tab === "admins" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold">Admin Accounts</h2>
              <button onClick={() => setShowCreateAdmin(true)}
                className="bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition">
                + Create Admin
              </button>
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              {admins.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No admins yet</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d1117]/50">
                      {["Admin", "Email", "Status", "Created", "Actions"].map(h => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a, i) => (
                      <tr key={a.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                              {(a.full_name || "A").charAt(0)}
                            </div>
                            <div className="font-bold text-sm">{a.full_name}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">{a.email}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${a.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                            ● {a.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {new Date(a.created_at).toLocaleDateString('en-KE')}
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={async () => {
                            const newStatus = a.status === 'active' ? 'suspended' : 'active';
                            await supabase.from('admin_profiles').update({ status: newStatus }).eq('id', a.id);
                            showToast(`Admin ${newStatus}`);
                            fetchAll();
                          }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold ${a.status === 'active' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 'bg-green-400/10 text-green-400 border border-green-400/20'}`}>
                            {a.status === 'active' ? '🔒 Suspend' : '✅ Activate'}
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

        {/* LANDLORDS */}
        {tab === "landlords" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">All Landlords</h2>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Landlord", "Email", "Status", "Approved", "Actions"].map(h => (
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
                          <div>
                            <div className="font-bold text-sm">{l.full_name}</div>
                            <div className="text-xs text-gray-500">{l.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">{l.email}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${l.status === 'approved' ? 'bg-green-400/10 text-green-400' : l.status === 'suspended' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                          ● {l.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {l.approved_at ? new Date(l.approved_at).toLocaleDateString('en-KE') : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            const s = l.status === 'approved' ? 'suspended' : 'approved';
                            await supabase.from('landlord_profiles').update({ status: s }).eq('id', l.id);
                            showToast(`Landlord ${s}`);
                            fetchAll();
                          }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold ${l.status === 'approved' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 'bg-green-400/10 text-green-400 border border-green-400/20'}`}>
                            {l.status === 'approved' ? '🔒 Suspend' : '✅ Approve'}
                          </button>
                          <button onClick={async () => {
                            await supabase.from('landlord_profiles').delete().eq('id', l.id);
                            showToast("Landlord deleted");
                            fetchAll();
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
            </div>
          </div>
        )}

        {/* TENANTS */}
        {tab === "tenants" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">All Tenants</h2>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Tenant", "Email", "Unit", "Status", "Deposit", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t, i) => {
                    const deposit = deposits.find(d => d.user_id === t.id);
                    return (
                      <tr key={t.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-4">
                          <div className="font-bold text-sm">{t.full_name || "—"}</div>
                          <div className="text-xs text-gray-500">{t.phone}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">{t.email}</td>
                        <td className="px-5 py-4 text-sm text-gray-300">{t.unit || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status === 'approved' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                            ● {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${deposit?.status === 'confirmed' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                            {deposit?.status === 'confirmed' ? '✅ Paid' : '❌ Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={async () => {
                            await supabase.from('tenant_profiles').delete().eq('id', t.id);
                            showToast("Tenant deleted");
                            fetchAll();
                          }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 font-bold">
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEPOSITS */}
        {tab === "deposits" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">Tenant Deposits</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: "Total Deposits", value: fmt(stats.totalDeposits), color: "#4ade80" },
                { label: "Pending", value: stats.pendingDeposits || 0, color: "#f87171" },
                { label: "Confirmed", value: deposits.filter(d => d.status === 'confirmed').length, color: "#4ade80" },
              ].map((s, i) => (
                <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-4 text-center">
                  <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              {deposits.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No deposits yet</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d1117]/50">
                      {["Tenant", "Amount", "Reference", "Status", "Date", "Actions"].map(h => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((d, i) => {
                      const tenant = tenants.find(t => t.id === d.user_id);
                      return (
                        <tr key={d.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                          <td className="px-5 py-4 text-sm font-bold">{tenant?.full_name || tenant?.email || "Unknown"}</td>
                          <td className="px-5 py-4 text-sm font-bold text-green-400">{fmt(d.amount)}</td>
                          <td className="px-5 py-4 text-xs text-gray-500 font-mono">{d.mpesa_reference || "—"}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${d.status === 'confirmed' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                              ● {d.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500">
                            {new Date(d.created_at).toLocaleDateString('en-KE')}
                          </td>
                          <td className="px-5 py-4">
                            {d.status === 'pending' && (
                              <button onClick={() => confirmDeposit(d.id, d.user_id)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 font-bold">
                                ✅ Confirm
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-extrabold">All Payments</h2>
              <div className="text-sm font-bold text-green-400">
                Total: {fmt(payments.reduce((s, p) => s + (p.amount || 0), 0))}
              </div>
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
                  {payments.map((p, i) => (
                    <tr key={p.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-5 py-4 text-sm text-gray-300">{p.tenant_id?.slice(0, 8)}...</td>
                      <td className="px-5 py-4 text-sm font-extrabold text-green-400">{fmt(p.amount)}</td>
                      <td className="px-5 py-4 text-sm text-gray-300">{p.month}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full font-bold uppercase">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 font-mono">{p.reference}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('en-KE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">⚙️ System Settings</h2>
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 mb-4">
              <p className="text-yellow-400 font-bold text-sm">⚠️ Developer Access Only</p>
              <p className="text-gray-400 text-xs mt-1">Changes here affect the entire system. Be careful!</p>
            </div>

            <div className="space-y-3">
              {settings.map(s => (
                <div key={s.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{s.key}</div>
                      {editSetting === s.key ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            defaultValue={s.value}
                            id={`setting-${s.key}`}
                            className="flex-1 bg-[#0d1117] border border-[#f0b429] rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                          />
                          <button onClick={() => {
                            const val = document.getElementById(`setting-${s.key}`).value;
                            updateSetting(s.key, val);
                          }}
                            className="bg-green-400 text-black font-bold px-4 py-2 rounded-xl text-xs">
                            Save
                          </button>
                          <button onClick={() => setEditSetting(null)}
                            className="bg-white/10 text-gray-400 font-bold px-3 py-2 rounded-xl text-xs">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-sm text-white">
                            {s.key.includes('passkey') || s.key.includes('secret')
                              ? s.value?.slice(0, 10) + '...'
                              : s.value
                            }
                          </span>
                          {s.updated_at && (
                            <span className="text-xs text-gray-600">
                              Updated {new Date(s.updated_at).toLocaleDateString('en-KE')}
                            </span>
                          )}
                        </div>
                      )}
                      {s.description && (
                        <div className="text-xs text-gray-500 mt-1">{s.description}</div>
                      )}
                    </div>
                    {editSetting !== s.key && (
                      <button onClick={() => setEditSetting(s.key)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#f0b429]/10 text-[#f0b429] border border-[#f0b429]/20 font-bold ml-4">
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIT LOGS */}
        {tab === "logs" && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold">📋 Audit Logs</h2>
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No logs yet</div>
              ) : logs.map((l, i) => (
                <div key={l.id} className={`flex items-start gap-3 p-4 ${i > 0 ? "border-t border-white/5" : ""}`}>
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{l.action}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {l.user_email} · {l.table_name} · {new Date(l.created_at).toLocaleString('en-KE')}
                    </div>
                  </div>
                </div>
              ))}
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
            <h2 className="font-extrabold text-xl mb-6 text-purple-400">👤 Create Admin Account</h2>
            {[
              { key: "name", label: "Full Name", placeholder: "Admin Name" },
              { key: "email", label: "Email Address", placeholder: "admin@email.com", type: "email" },
              { key: "phone", label: "Phone", placeholder: "+254 700 000 000" },
              { key: "password", label: "Password", placeholder: "Min 8 characters", type: "password" },
            ].map(f => (
              <div key={f.key} className="mb-4">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{f.label}</label>
                <input
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={newAdmin[f.key]}
                  onChange={e => setNewAdmin(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-400 transition"
                />
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <button onClick={createAdmin}
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

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}