"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const ADMIN_EMAIL = "bundoxb@gmail.com";

export default function CreateLandlord() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [landlords, setLandlords] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      window.location.assign('/dashboard');
    }
  };

  const fetchLandlords = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'landlord')
      .order('created_at', { ascending: false });
    setLandlords(data || []);
  };

  useEffect(() => {
    checkAdmin();
    fetchLandlords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createLandlord = async () => {
    if (!form.name || !form.email || !form.password) {
      showToast("Please fill in all required fields");
      return;
    }
    if (form.password.length < 8) {
      showToast("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    // Create user account
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          phone: form.phone,
          role: 'landlord',
        }
      }
    });

    if (error) { showToast("Error: " + error.message); setLoading(false); return; }

    // Update profile to approved
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        role: 'landlord',
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: ADMIN_EMAIL
      });
    }

    showToast(`✅ Landlord account created for ${form.name}!`);
    setForm({ name: "", email: "", phone: "", password: "" });
    fetchLandlords();
    setLoading(false);
  };

  const toggleStatus = async (id, currentStatus, name) => {
    const newStatus = currentStatus === 'approved' ? 'suspended' : 'approved';
    await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    showToast(`${name} is now ${newStatus}`);
    fetchLandlords();
  };

  const deleteLandlord = async (id, name) => {
    await supabase.from('profiles').delete().eq('id', id);
    showToast(`🗑️ ${name} removed`);
    fetchLandlords();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">
      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div>
          <div className="text-xl font-extrabold text-[#f0b429]">
            Rent<span className="text-white">Flow</span>
            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full ml-2">ADMIN</span>
          </div>
          <div className="text-xs text-gray-500">Create & Manage Landlords</div>
        </div>
        <div className="flex gap-3">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition">← Admin Panel</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* CREATE FORM */}
        <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-extrabold mb-6 flex items-center gap-2">
            <span>🏢</span> Create New Landlord Account
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {[
              { key: "name", label: "Full Name *", placeholder: "e.g. John Mutua" },
              { key: "email", label: "Email Address *", placeholder: "john@example.com", type: "email" },
              { key: "phone", label: "Phone Number", placeholder: "+254 712 345 678" },
              { key: "password", label: "Password *", placeholder: "Min 8 characters", type: "password" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{f.label}</label>
                <input
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition"
                />
              </div>
            ))}
          </div>

          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4">
            <p className="text-yellow-400 text-xs font-bold">⚠️ Important:</p>
            <p className="text-gray-400 text-xs mt-1">
              Share the email and password with the landlord securely. They will be required to enter an OTP every time they login for security.
            </p>
          </div>

          <button onClick={createLandlord} disabled={loading}
            className="bg-[#f0b429] text-black font-extrabold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center gap-2">
            {loading ? "Creating..." : "✅ Create Landlord Account"}
          </button>
        </div>

        {/* LANDLORDS LIST */}
        <div>
          <h2 className="text-lg font-extrabold mb-4">
            All Landlords ({landlords.length})
          </h2>
          <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
            {landlords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No landlords yet</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Landlord", "Email", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {landlords.map((l, i) => (
                    <tr key={l.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center font-bold text-sm">
                            {(l.full_name || "L").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{l.full_name || "—"}</div>
                            <div className="text-xs text-gray-500">{l.phone || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-300">{l.email}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          l.status === 'approved' ? 'bg-green-400/10 text-green-400' :
                          l.status === 'suspended' ? 'bg-red-400/10 text-red-400' :
                          'bg-yellow-400/10 text-yellow-400'
                        }`}>
                          ● {l.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => toggleStatus(l.id, l.status, l.full_name)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                              l.status === 'approved'
                                ? 'bg-red-400/10 text-red-400 border border-red-400/20'
                                : 'bg-green-400/10 text-green-400 border border-green-400/20'
                            }`}>
                            {l.status === 'approved' ? '🔒 Suspend' : '✅ Activate'}
                          </button>
                          <button onClick={() => deleteLandlord(l.id, l.full_name)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/10 font-bold">
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
      </div>

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}