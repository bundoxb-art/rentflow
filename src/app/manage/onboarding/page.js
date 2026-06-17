"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ManagerOnboarding() {
  const [step, setStep] = useState(1);
  const [manager, setManager] = useState(null);
  const [apartment, setApartment] = useState({ name: "", address: "", city: "Mombasa", total_units: "" });
  const [superAdmin, setSuperAdmin] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [aptCreated, setAptCreated] = useState(null);
  const router = useRouter();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/manage/login'); return; }

      const { data: mgr } = await supabase
        .from('managers').select('*').eq('email', user.email).single();

      if (!mgr) { router.push('/manage/login'); return; }
      setManager(mgr);
    };
    init();
  }, []);

  const createFirstApartment = async () => {
    if (!apartment.name) { showToast("Enter apartment name"); return; }
    setLoading(true);

    const { data, error } = await supabase.from('apartments').insert({
      manager_id: manager.id,
      name: apartment.name,
      address: apartment.address,
      city: apartment.city,
      total_units: parseInt(apartment.total_units) || 0,
      status: 'active',
    }).select().single();

    if (error) { showToast("Error: " + error.message); setLoading(false); return; }

    setAptCreated(data);
    setLoading(false);
    setStep(2);
  };

  const createFirstSuperAdmin = async () => {
    if (!superAdmin.name || !superAdmin.email || !superAdmin.password) {
      showToast("Fill in all required fields"); return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: superAdmin.email,
      password: superAdmin.password,
      options: { data: { full_name: superAdmin.name, role: 'super_admin' } }
    });

    if (error) { showToast("Error: " + error.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from('super_admins').insert({
        id: data.user.id,
        manager_id: manager.id,
        full_name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        status: 'active',
        created_by: manager.email,
      });
    }

    setLoading(false);
    setStep(3);
  };

  const skipSuperAdmin = () => setStep(3);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-2xl font-extrabold text-[#f0b429]">
            RentFlow <span className="text-white">Pro</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Let&apos;s get you set up in 2 quick steps</p>
        </div>

        {/* Progress */}
        <div className="flex items-center mb-8 px-4">
          {[
            { n: 1, label: "Add Apartment" },
            { n: 2, label: "Add Super Admin" },
            { n: 3, label: "Done!" },
          ].map((s, i) => (
            <div key={s.n} className="flex-1 flex flex-col items-center">
              <div className="relative flex items-center w-full">
                {i > 0 && <div className={`flex-1 h-0.5 ${step > i ? "bg-[#f0b429]" : "bg-white/10"}`} />}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-all ${
                  step > s.n ? "bg-green-400 text-black" :
                  step === s.n ? "bg-[#f0b429] text-black" :
                  "bg-white/10 text-gray-500"
                }`}>
                  {step > s.n ? "✓" : s.n}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? "bg-[#f0b429]" : "bg-white/10"}`} />}
              </div>
              <div className={`text-xs mt-1 font-bold ${step === s.n ? "text-[#f0b429]" : "text-gray-600"}`}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* STEP 1 — ADD FIRST APARTMENT */}
        {step === 1 && (
          <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🏢</div>
              <h2 className="text-xl font-extrabold">Add Your First Apartment</h2>
              <p className="text-gray-400 text-sm mt-1">You can add more apartments later</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                  Apartment Name <span className="text-red-400">*</span>
                </label>
                <input placeholder="e.g. Sunrise Apartments"
                  value={apartment.name}
                  onChange={e => setApartment(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Address</label>
                <input placeholder="e.g. 123 Nyali Road"
                  value={apartment.address}
                  onChange={e => setApartment(p => ({ ...p, address: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">City</label>
                  <input placeholder="e.g. Mombasa"
                    value={apartment.city}
                    onChange={e => setApartment(p => ({ ...p, city: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Total Units</label>
                  <input type="number" placeholder="e.g. 24"
                    value={apartment.total_units}
                    onChange={e => setApartment(p => ({ ...p, total_units: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>
              </div>

              <button onClick={createFirstApartment} disabled={loading}
                className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? "Creating..." : "Create Apartment →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — ADD SUPER ADMIN */}
        {step === 2 && (
          <div className="bg-[#111827] border border-purple-500/20 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👑</div>
              <h2 className="text-xl font-extrabold">Add a Super Admin</h2>
              <p className="text-gray-400 text-sm mt-1">
                Someone who will manage {aptCreated?.name} and all other apartments
              </p>
            </div>

            <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-3 mb-4">
              <p className="text-green-400 text-xs font-bold">
                ✅ {aptCreated?.name} created successfully!
              </p>
            </div>

            <div className="space-y-4">
              {[
                { key: "name", label: "Full Name *", placeholder: "Super Admin Name" },
                { key: "email", label: "Email *", placeholder: "superadmin@company.com", type: "email" },
                { key: "phone", label: "Phone", placeholder: "+254 700 000 000" },
                { key: "password", label: "Password *", placeholder: "Min 8 characters", type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={superAdmin[f.key]}
                    onChange={e => setSuperAdmin(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-400 transition" />
                </div>
              ))}

              <button onClick={createFirstSuperAdmin} disabled={loading}
                className="w-full bg-purple-500 text-white font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70">
                {loading ? "Creating..." : "Create Super Admin →"}
              </button>

              <button onClick={skipSuperAdmin}
                className="w-full bg-white/5 text-gray-400 font-bold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                Skip for now — I&apos;ll add later
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — DONE! */}
        {step === 3 && (
          <div className="bg-[#111827] border border-green-400/20 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-extrabold mb-3">You&apos;re All Set!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Your RentFlow Pro account is ready. Go to your dashboard to continue setting up.
            </p>

            <div className="bg-[#0d1117] rounded-2xl p-4 mb-6 text-left space-y-3">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">What&apos;s Next:</div>
              {[
                "➡️ Create more apartments from your dashboard",
                "➡️ Super Admin assigns Apartment Admins",
                "➡️ Apartment Admin creates Landlords",
                "➡️ Tenants self-signup and get approved",
                "➡️ Rent payments flow through M-Pesa automatically",
              ].map((s, i) => (
                <div key={i} className="text-gray-300 text-sm">{s}</div>
              ))}
            </div>

            <button onClick={() => window.location.href = '/manage'}
              className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition">
              Go to Manager Dashboard →
            </button>
          </div>
        )}

        {/* Toast */}
        <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          {toast}
        </div>
      </div>
    </div>
  );
}