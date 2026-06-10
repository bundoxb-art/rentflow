"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ManagerRegister() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    company: "", password: "", confirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const register = async () => {
    setLoading(true);
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields");
      setLoading(false); return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords don't match");
      setLoading(false); return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false); return;
    }

    // Create auth account
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role: 'manager' }
      }
    });

    if (error) { setError(error.message); setLoading(false); return; }

    if (data.user) {
      // Create manager record
      const { error: mgrError } = await supabase.from('managers').insert({
        id: data.user.id,
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        company_name: form.company,
        status: 'active',
      });

      if (mgrError) { setError(mgrError.message); setLoading(false); return; }
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-sans">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-extrabold text-white mb-3">Registration Complete!</h1>
          <p className="text-gray-400 text-sm mb-6">Your manager account has been created. Please verify your email then login.</p>
          <a href="/manage/login"
            className="inline-block bg-[#f0b429] text-black font-extrabold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition">
            Go to Login →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-8 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#f0b429]">RentFlow <span className="text-white">Pro</span></div>
          <div className="inline-block bg-[#f0b429]/10 border border-[#f0b429]/20 text-[#f0b429] text-xs font-bold px-4 py-1.5 rounded-full mt-2">
            🏢 MANAGER REGISTRATION
          </div>
        </div>

        <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-8">
          <h1 className="text-xl font-extrabold mb-2 text-center">Create Manager Account</h1>
          <p className="text-gray-500 text-xs text-center mb-6">Register to manage your properties</p>

          <div className="space-y-4">
            {[
              { name: "name", label: "Full Name *", placeholder: "Your full name" },
              { name: "email", label: "Email Address *", placeholder: "you@company.com", type: "email" },
              { name: "phone", label: "Phone Number", placeholder: "+254 700 000 000" },
              { name: "company", label: "Company/Business Name", placeholder: "e.g. Mombasa Properties Ltd" },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">{f.label}</label>
                <input name={f.name} type={f.type || "text"} placeholder={f.placeholder}
                  value={form[f.name]} onChange={handle}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
              </div>
            ))}

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Password *</label>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters" value={form.password} onChange={handle}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Confirm Password *</label>
              <input name="confirm" type="password" placeholder="Repeat password"
                value={form.confirm} onChange={handle}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
            </div>

            {error && <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold">{error}</div>}

            <button onClick={register} disabled={loading}
              className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70">
              {loading ? "Creating Account..." : "Create Manager Account →"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Already registered?{" "}
              <a href="/manage/login" className="text-[#f0b429] font-bold hover:underline">Login here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}