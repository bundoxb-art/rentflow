"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("tenant");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    password: "", unit: "", property: "", message: ""
  });
  const [otp, setOtp] = useState(["","","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 7);
      const newOtp = Array(7).fill('');
      digits.split('').forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      document.getElementById(`otp-${Math.min(digits.length, 6)}`)?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 6) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const submitForm = async () => {
    setLoading(true);
    setError("");

    if (mode === "signup") {
      // Only tenants can self-signup
      if (role === "landlord") {
        setError("Landlord accounts are created by admin only. Contact support.");
        setLoading(false);
        return;
      }

      // Validate tenant fields
      if (!form.name) { setError("Please enter your full name"); setLoading(false); return; }
      if (!form.email) { setError("Please enter your email"); setLoading(false); return; }
      if (!form.unit) { setError("Please enter your unit number"); setLoading(false); return; }
      if (!form.password || form.password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false); return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            phone: form.phone,
            role: "tenant",
            unit: form.unit,
            property: form.property,
          }
        }
      });

      if (error) { setError(error.message); setLoading(false); return; }

      // Create tenant request
      if (data.user) {
        await supabase.from("tenant_requests").insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          unit: form.unit,
          property_name: form.property,
          message: form.message,
          status: "pending",
          user_id: data.user.id
        });
      }

      // Store for OTP
      localStorage.setItem('rentflow_verify_email', form.email);
      localStorage.setItem('rentflow_verify_role', 'tenant');
      localStorage.setItem('rentflow_verify_mode', 'signup');

      setStep(2);
      setSuccess(`📧 Verification code sent to ${form.email}`);
      setLoading(false);
      return;
    }

    if (mode === "login") {
      if (!form.email) { setError("Please enter your email"); setLoading(false); return; }
      if (!form.password) { setError("Please enter your password"); setLoading(false); return; }

      // Verify credentials first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) { setError(error.message); setLoading(false); return; }

      if (data?.session) {
        // Sign out and require OTP
        await supabase.auth.signOut();

        // Send OTP
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: form.email,
          options: { shouldCreateUser: false }
        });

        // Store for OTP verification
        localStorage.setItem('rentflow_verify_email', form.email);
        localStorage.setItem('rentflow_verify_password', form.password);
        localStorage.setItem('rentflow_verify_role', role);
        localStorage.setItem('rentflow_verify_mode', 'login');
        window.location.href = '/verify-otp';
      }
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("").slice(0, 6);
    if (otpCode.length < 6) { setError("Please enter the complete code"); return; }

    setLoading(true);
    setError("");

    const email = localStorage.getItem('rentflow_verify_email');
    const savedRole = localStorage.getItem('rentflow_verify_role') || 'tenant';
    const verifyMode = localStorage.getItem('rentflow_verify_mode');
    const password = localStorage.getItem('rentflow_verify_password');

    // Try verifying OTP
    let verified = false;

    const types = verifyMode === 'signup' ? ['signup', 'email'] : ['email', 'magiclink'];

    for (const type of types) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type
      });
      if (!error && data?.session) {
        verified = true;
        break;
      }
    }

    // If OTP verification failed, try signing in with password
    if (!verified && verifyMode === 'login' && password) {
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email, password
      });
      if (loginData?.session) verified = true;
    }

    if (!verified) {
      setError("Invalid code. Please try again.");
      setLoading(false);
      return;
    }

    // Clear stored data
    localStorage.removeItem('rentflow_verify_email');
    localStorage.removeItem('rentflow_verify_role');
    localStorage.removeItem('rentflow_verify_password');
    localStorage.removeItem('rentflow_verify_mode');

    // Check profile status
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'landlord' && profile?.status === 'pending') {
        window.location.href = '/pending-approval';
        return;
      }

      if (profile?.role === 'landlord' && profile?.status === 'rejected') {
        await supabase.auth.signOut();
        setError("Your account has been rejected. Contact support.");
        setStep(1);
        setLoading(false);
        return;
      }

      if (savedRole === 'tenant' && verifyMode === 'signup') {
        window.location.href = '/tenant-pending';
        return;
      }

      if (profile?.role === 'tenant' && profile?.status === 'pending') {
        window.location.href = '/tenant-pending';
        return;
      }
    }

    window.location.href = savedRole === 'tenant' ? '/tenant' : '/dashboard';
  };

  const resendOtp = async () => {
    setLoading(true);
    const email = localStorage.getItem('rentflow_verify_email');
    const verifyMode = localStorage.getItem('rentflow_verify_mode');

    if (verifyMode === 'signup') {
      await supabase.auth.resend({ type: 'signup', email });
    } else {
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });
    }

    setSuccess("✅ New code sent to your email!");
    setOtp(["","","","","","",""]);
    setTimeout(() => setSuccess(""), 3000);
    document.getElementById('otp-0')?.focus();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex font-sans">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-[#111827] via-[#1a2235] to-[#0d1117] p-14 border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-[#f0b429]/10 rounded-full blur-[120px]" />
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
            RentFlow gives you a real-time view of every unit, every payment, and every tenant.
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
              &quot;RentFlow changed how I manage my 12 units in Mombasa.&quot;
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
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md">

          <div className="lg:hidden text-2xl font-extrabold text-[#f0b429] mb-6 text-center">
            Rent<span className="text-white">Flow</span>
          </div>

          {/* STEP 1 — FORM */}
          {step === 1 && (
            <>
              {/* Toggle Login/Signup */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-1 flex mb-6">
                {["login", "signup"].map((m) => (
                  <button key={m}
                    onClick={() => { setMode(m); setError(""); setRole(m === "signup" ? "tenant" : role); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === m ? "bg-[#f0b429] text-black" : "text-gray-400 hover:text-white"}`}>
                    {m === "login" ? "Log In" : "Sign Up (Tenant)"}
                  </button>
                ))}
              </div>

              {/* Role selector — only show on login */}
              {mode === "login" && (
                <div className="mb-6">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">I am a</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "landlord", icon: "🏢", label: "Landlord", sub: "I own/manage properties" },
                      { key: "tenant", icon: "🏠", label: "Tenant", sub: "I rent a property" },
                    ].map((r) => (
                      <button key={r.key} onClick={() => setRole(r.key)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${role === r.key ? "border-[#f0b429] bg-[#f0b429]/10" : "border-white/10 bg-[#111827] hover:border-white/20"}`}>
                        <div className="text-2xl mb-2">{r.icon}</div>
                        <div className={`text-sm font-bold ${role === r.key ? "text-[#f0b429]" : "text-white"}`}>{r.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Signup notice */}
              {mode === "signup" && (
                <div className="bg-blue-400/10 border border-blue-400/20 rounded-xl p-4 mb-6">
                  <div className="text-blue-400 font-bold text-sm mb-1">🏠 Tenant Sign Up</div>
                  <div className="text-gray-400 text-xs">
                    Fill in your details and your landlord will approve your account.
                    Landlord accounts are created by admin only.
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Full Name</label>
                      <input name="name" value={form.name} onChange={handle}
                        placeholder="e.g. James Mwangi"
                        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Phone Number</label>
                      <div className="flex gap-2">
                        <div className="bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-gray-400 text-sm flex items-center">🇰🇪 +254</div>
                        <input name="phone" value={form.phone} onChange={handle} placeholder="712 345 678"
                          className="flex-1 bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                        Unit Number <span className="text-red-400">*</span>
                      </label>
                      <input name="unit" value={form.unit} onChange={handle}
                        placeholder="e.g. A1, B2, 101"
                        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Property Name</label>
                      <input name="property" value={form.property} onChange={handle}
                        placeholder="e.g. Sunrise Apartments"
                        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Message to Landlord</label>
                      <textarea name="message" value={form.message} onChange={handle}
                        placeholder="Any additional information..."
                        rows={2}
                        className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition resize-none" />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Email Address</label>
                  <input name="email" value={form.email} onChange={handle}
                    placeholder="you@example.com" type="email"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Password</label>
                    {mode === "login" && (
                      <Link href="/forgot-password" className="text-xs text-[#f0b429] hover:underline">Forgot password?</Link>
                    )}
                  </div>
                  <div className="relative">
                    <input name="password" type={showPassword ? "text" : "password"}
                      value={form.password} onChange={handle} placeholder="••••••••"
                      className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition text-lg">
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {mode === "signup" && form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                            form.password.length >= i * 3
                              ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-yellow-400" : i <= 3 ? "bg-blue-400" : "bg-green-400"
                              : "bg-white/10"
                          }`} />
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {form.password.length < 3 ? "Too short" : form.password.length < 6 ? "Weak" : form.password.length < 9 ? "Good" : "Strong 💪"}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold">
                    {error}
                  </div>
                )}

                <button onClick={submitForm} disabled={loading}
                  className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {mode === "login" ? "Verifying..." : "Creating account..."}
                    </>
                  ) : mode === "login"
                    ? `Log In as ${role === "landlord" ? "Landlord 🏢" : "Tenant 🏠"} →`
                    : "Create Tenant Account →"
                  }
                </button>

                {/* Google Login */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-gray-600 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/auth/callback` }
                  });
                }}
                  className="w-full bg-[#111827] border border-white/10 rounded-xl py-3.5 text-sm text-gray-300 font-bold hover:border-white/20 hover:text-white transition flex items-center justify-center gap-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {mode === "login" && (
                <p className="text-center text-gray-500 text-xs mt-6">
                  Are you a tenant?{" "}
                  <button onClick={() => { setMode("signup"); setRole("tenant"); setError(""); }}
                    className="text-[#f0b429] font-bold hover:underline">
                    Create tenant account
                  </button>
                </p>
              )}
            </>
          )}

          {/* STEP 2 — OTP */}
          {step === 2 && (
            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <h1 className="text-2xl font-extrabold mb-2">Verify Your Email</h1>
              <p className="text-gray-400 text-sm mb-2">We sent a verification code to:</p>
              <p className="text-[#f0b429] font-extrabold mb-2">
                {form.email || localStorage.getItem('rentflow_verify_email')}
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Check your inbox and spam folder
              </p>

              {success && (
                <div className="bg-green-400/10 text-green-400 border border-green-400/20 rounded-xl p-3 text-sm font-bold mb-4">
                  {success}
                </div>
              )}

              {/* OTP Boxes */}
              <div className="flex gap-1.5 sm:gap-2 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-lg font-extrabold rounded-xl border-2 bg-[#111827] text-white transition-all outline-none
                      ${digit ? "border-[#f0b429]" : "border-white/10"} focus:border-[#f0b429]`}
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
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Verifying...
                  </>
                ) : "Verify & Continue →"}
              </button>

              <div className="flex justify-between text-sm">
                <button onClick={() => { setStep(1); setOtp(["","","","","","",""]); setError(""); }}
                  className="text-gray-500 hover:text-white transition">← Back</button>
                <button onClick={resendOtp} disabled={loading}
                  className="text-[#f0b429] font-bold hover:underline disabled:opacity-50">
                  Resend Code
                </button>
              </div>

              <p className="text-gray-600 text-xs mt-4">
                🔒 For your security, a new code is required every time you log in
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
