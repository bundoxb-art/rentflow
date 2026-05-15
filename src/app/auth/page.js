"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient(
  'https://vrelkjytegukqxgustmj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'
)

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("landlord");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            phone: form.phone,
            role: role,
          }
        }
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setError("✅ Account created! Please check your email to verify.");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) { setError(error.message); setLoading(false); return; }
      if (role === "landlord") router.push("/dashboard");
      else router.push("/tenant");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex font-sans">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-[#111827] via-[#1a2235] to-[#0d1117] p-14 border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#f0b429]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-[#f0b429]/5 rounded-full blur-[100px]" />
        <div className="text-2xl font-extrabold text-[#f0b429] relative z-10">Rent<span className="text-white">Flow</span></div>
        <div className="relative z-10">
          <div className="inline-block bg-[#f0b429]/10 border border-[#f0b429]/20 text-[#f0b429] text-xs font-bold px-4 py-2 rounded-full mb-8">
            🇰🇪 Trusted by landlords across Kenya
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Collect rent.<br />
            <span className="text-[#f0b429]">Not excuses.</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10">
            RentFlow gives you a real-time view of every unit, every payment, and every tenant — so you are always in control.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { val: "98%", label: "Collection Rate" },
              { val: "8hrs", label: "Saved Per Month" },
              { val: "5min", label: "Setup Time" },
            ].map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl font-extrabold text-[#f0b429]">{s.val}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              "RentFlow changed how I manage my 12 units in Mombasa. I no longer call tenants — the system does it all for me."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#f0b429] flex items-center justify-center text-black font-bold text-sm">JM</div>
              <div>
                <div className="text-white text-sm font-bold">James Mwangi</div>
                <div className="text-gray-500 text-xs">Landlord · Mombasa, Kenya</div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-gray-600 text-xs relative z-10">© 2025 RentFlow · Built for East Africa</div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#f0b429]/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="w-full max-w-md relative z-10">

          <div className="lg:hidden text-2xl font-extrabold text-[#f0b429] mb-8 text-center">
            Rent<span className="text-white">Flow</span>
          </div>

          {/* Toggle */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-1 flex mb-8">
            {["login", "signup"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${mode === m ? "bg-[#f0b429] text-black shadow-lg" : "text-gray-400 hover:text-white"}`}>
                {m === "login" ? "Log In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Role Selector */}
          <div className="mb-8">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">I am a</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "landlord", icon: "🏢", label: "Landlord", sub: "I own/manage properties" },
                { key: "tenant", icon: "🏠", label: "Tenant", sub: "I rent a property" },
              ].map((r) => (
                <button key={r.key} onClick={() => setRole(r.key)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${role === r.key ? "border-[#f0b429] bg-[#f0b429]/10" : "border-white/10 bg-[#111827] hover:border-white/20"}`}>
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <div className={`text-sm font-bold ${role === r.key ? "text-[#f0b429]" : "text-white"}`}>{r.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Full Name</label>
                <input name="name" value={form.name} onChange={handle} placeholder="e.g. James Mwangi"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Email Address</label>
              <input name="email" value={form.email} onChange={handle} placeholder="you@example.com"
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <div className="bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-gray-400 text-sm flex items-center">🇰🇪 +254</div>
                  <input name="phone" value={form.phone} onChange={handle} placeholder="712 345 678"
                    className="flex-1 bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>
              </div>
            )}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Password</label>
                {mode === "login" && <Link href="/forgot-password" className="text-xs text-[#f0b429] hover:underline">Forgot password?</Link>}
              </div>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••"
                className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
            </div>

            {/* Error/Success Message */}
            {error && (
              <div className={`p-3 rounded-xl text-sm font-bold ${error.startsWith("✅") ? "bg-green-400/10 text-green-400 border border-green-400/20" : "bg-red-400/10 text-red-400 border border-red-400/20"}`}>
                {error}
              </div>
            )}

            <button onClick={submit} disabled={loading}
              className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Please wait...
                </>
              ) : mode === "login" ? `Log In as ${role === "landlord" ? "Landlord 🏢" : "Tenant 🏠"} →` : "Create My Account →"}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              className="text-[#f0b429] font-bold hover:underline">
              {mode === "login" ? "Sign up free" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}