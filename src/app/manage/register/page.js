"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
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

    localStorage.removeItem('mgr_reg_email');
    localStorage.removeItem('mgr_reg_password');

    // Go to onboarding
    window.location.href = '/manage/onboarding';
  };

  const resendOtp = async () => {
    setLoading(true);
    const email = localStorage.getItem('mgr_reg_email');
    await supabase.auth.resend({ type: 'signup', email });
    setOtp(["","","","","","",""]);
    setError("");
    setLoading(false);
    document.getElementById('otp-0')?.focus();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex font-sans">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-[#111827] p-12 border-r border-white/5">
        <div className="text-2xl font-extrabold text-[#f0b429]">
          RentFlow <span className="text-white">Pro</span>
        </div>
        <div>
          <div className="inline-block bg-[#f0b429]/10 border border-[#f0b429]/20 text-[#f0b429] text-xs font-bold px-4 py-2 rounded-full mb-6">
            🇰🇪 Built for Kenya & East Africa
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Manage all your<br />
            <span className="text-[#f0b429]">properties in one place</span>
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Join property managers across Kenya using RentFlow Pro to manage apartments, collect rent and track finances.
          </p>
          <div className="space-y-3">
            {[
              "✅ Unlimited apartments",
              "✅ Automated rent collection via M-Pesa",
              "✅ Real-time payment tracking",
              "✅ Auto-generated receipts",
              "✅ Financial reports (monthly & yearly)",
              "✅ Tenant & landlord management",
              "✅ Secure OTP login for all users",
            ].map((f, i) => (
              <div key={i} className="text-gray-300 text-sm">{f}</div>
            ))}
          </div>
        </div>
        <div className="text-gray-600 text-xs">© 2025 RentFlow Pro · Mombasa, Kenya</div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-md">

          <div className="lg:hidden text-2xl font-extrabold text-[#f0b429] mb-6 text-center">
            RentFlow <span className="text-white">Pro</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {["Company Details", "Verify Email", "Get Started"].map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                  step > i + 1 ? "bg-green-400 text-black" :
                  step === i + 1 ? "bg-[#f0b429] text-black" :
                  "bg-white/10 text-gray-500"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <div className={`text-xs font-bold hidden sm:block ${step === i + 1 ? "text-[#f0b429]" : "text-gray-600"}`}>
                  {s}
                </div>
              </div>
            ))}
          </div>

          {/* STEP 1 — REGISTRATION FORM */}
          {step === 1 && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">
              <h1 className="text-xl font-extrabold mb-1">Create Your Manager Account</h1>
              <p className="text-gray-500 text-sm mb-6">
                Already registered?{" "}
                <Link href="/manage/login" className="text-[#f0b429] font-bold hover:underline">
                  Login here
                </Link>
              </p>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input name="name" value={form.name} onChange={handle}
                    placeholder="e.g. John Mutua"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>

                {/* Company */}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                    Company / Business Name <span className="text-red-400">*</span>
                  </label>
                  <input name="company" value={form.company} onChange={handle}
                    placeholder="e.g. Mutua Properties Ltd"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input name="email" type="email" value={form.email} onChange={handle}
                    placeholder="you@company.com"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-gray-400 text-sm flex items-center flex-shrink-0">
                      🇰🇪 +254
                    </div>
                    <input name="phone" value={form.phone} onChange={handle}
                      placeholder="712 345 678"
                      className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input name="password" type={showPassword ? "text" : "password"}
                      value={form.password} onChange={handle} placeholder="Min 8 characters"
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                            form.password.length >= i * 2
                              ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-yellow-400" : i <= 3 ? "bg-blue-400" : "bg-green-400"
                              : "bg-white/10"
                          }`} />
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {form.password.length < 4 ? "Too short" : form.password.length < 8 ? "Almost there" : form.password.length < 12 ? "Good" : "Strong 💪"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input name="confirm" type={showConfirm ? "text" : "password"}
                      value={form.confirm} onChange={handle} placeholder="Repeat password"
                      className={`w-full bg-[#0d1117] border rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none transition ${
                        form.confirm && form.confirm !== form.password ? "border-red-400" :
                        form.confirm && form.confirm === form.password ? "border-green-400" :
                        "border-white/10 focus:border-[#f0b429]"
                      }`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                      {showConfirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {form.confirm && form.confirm !== form.password && (
                    <div className="text-xs text-red-400 mt-1">Passwords do not match</div>
                  )}
                  {form.confirm && form.confirm === form.password && (
                    <div className="text-xs text-green-400 mt-1">✓ Passwords match</div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold">
                    {error}
                  </div>
                )}

                <button onClick={register} disabled={loading}
                  className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Creating account...</>
                  ) : "Create Manager Account →"}
                </button>

                <p className="text-center text-gray-600 text-xs">
                  By registering you agree to our{" "}
                  <a href="#" className="text-[#f0b429] hover:underline">Terms of Service</a> &{" "}
                  <a href="#" className="text-[#f0b429] hover:underline">Privacy Policy</a>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 — OTP VERIFICATION */}
          {step === 2 && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h1 className="text-xl font-extrabold mb-2">Verify Your Email</h1>
              <p className="text-gray-400 text-sm mb-2">
                We sent a 6-digit code to:
              </p>
              <p className="text-[#f0b429] font-extrabold mb-2">{form.email}</p>
              <p className="text-gray-500 text-xs mb-6">Check your inbox and spam folder</p>

              {/* OTP Boxes */}
              <div className="flex gap-1.5 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-lg font-extrabold rounded-xl border-2 bg-[#0d1117] text-white transition-all outline-none ${digit ? "border-[#f0b429]" : "border-white/10"} focus:border-[#f0b429]`}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold mb-4">
                  {error}
                </div>
              )}

              <button onClick={verifyOtp}
                disabled={loading || otp.join("").replace(/\s/g,'').length < 6}
                className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50 mb-4 flex items-center justify-center gap-2">
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Verifying...</>
                ) : "Verify Email →"}
              </button>

              <div className="flex justify-between text-sm">
                <button onClick={() => { setStep(1); setError(""); }}
                  className="text-gray-500 hover:text-white transition">← Back</button>
                <button onClick={resendOtp} disabled={loading}
                  className="text-[#f0b429] font-bold hover:underline disabled:opacity-50">
                  Resend Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}