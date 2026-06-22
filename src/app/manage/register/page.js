"use client";
import { useState } from "react";
import Link from "next/link";

export default function ManagerRegister() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const register = async () => {
    setLoading(true);
    setError("");

    if (!form.name) { setError("Please enter your full name"); setLoading(false); return; }
    if (!form.email) { setError("Please enter your email"); setLoading(false); return; }
    if (!form.company) { setError("Please enter your company/business name"); setLoading(false); return; }
    if (!form.password || form.password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match"); setLoading(false); return; }

    const res = await fetch('/api/admin/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        full_name: form.name,
        phone: form.phone,
        role: 'manager',
        extra: { company_name: form.company }
      })
    });

    const data = await res.json();

    if (!data.success) {
      setError(data.message || "Registration failed. Try a different email.");
      setLoading(false);
      return;
    }

    window.location.href = '/manage/login?registered=true';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex font-sans">

      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-[#111827] p-12 border-r border-white/5">
        <div className="text-2xl font-extrabold text-[#f0b429]">RentFlow <span className="text-white">Pro</span></div>
        <div>
          <div className="inline-block bg-[#f0b429]/10 border border-[#f0b429]/20 text-[#f0b429] text-xs font-bold px-4 py-2 rounded-full mb-6">
            🇰🇪 Built for Kenya & East Africa
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Manage all your<br /><span className="text-[#f0b429]">properties in one place</span>
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Join property managers across Kenya using RentFlow Pro.
          </p>
        </div>
        <div className="text-gray-600 text-xs">© 2026 RentFlow Pro · Mombasa, Kenya</div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-2xl font-extrabold text-[#f0b429] mb-6 text-center">RentFlow <span className="text-white">Pro</span></div>

          <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">
            <h1 className="text-xl font-extrabold mb-1">Create Your Manager Account</h1>
            <p className="text-gray-500 text-sm mb-6">
              Already registered?{" "}
              <Link href="/manage/login" className="text-[#f0b429] font-bold hover:underline">Login here</Link>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Full Name *</label>
                <input name="name" value={form.name} onChange={handle} placeholder="e.g. John Mutua"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Company / Business Name *</label>
                <input name="company" value={form.company} onChange={handle} placeholder="e.g. Mutua Properties Ltd"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Email Address *</label>
                <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@company.com"
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-gray-400 text-sm flex items-center flex-shrink-0">🇰🇪 +254</div>
                  <input name="phone" value={form.phone} onChange={handle} placeholder="712 345 678"
                    className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Password *</label>
                <div className="relative">
                  <input name="password" type="password" value={form.password} onChange={handle} placeholder="Min 8 characters"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Confirm Password *</label>
                <div className="relative">
                  <input name="confirm" type="password" value={form.confirm} onChange={handle} placeholder="Repeat password"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>
              </div>

              {error && <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold">{error}</div>}

              <button onClick={register} disabled={loading}
                className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70">
                {loading ? "Creating Account..." : "Create Manager Account →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}