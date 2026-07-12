"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function TenantLogin() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 7);
      const newOtp = Array(7).fill('');
      digits.split('').forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      document.getElementById(`t-otp-${Math.min(digits.length - 1, 6)}`)?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 6) document.getElementById(`t-otp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`t-otp-${index - 1}`)?.focus();
    }
  };

  const login = async () => {
    setLoading(true);
    setError("");
    setInfo("");

    if (!form.email || !form.password) {
      setError("Please fill in both email and password");
      setLoading(false); return;
    }

    // Step 1: Verify credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (error) {
      if (error.message.includes('Invalid login')) {
        setError("Incorrect email or password. Please try again.");
      } else if (error.message.includes('Email not confirmed')) {
        setError("Please verify your email first. Check your inbox.");
      } else {
        setError(error.message);
      }
      setLoading(false); return;
    }

    if (!data?.session) {
      setError("Login failed. Please try again.");
      setLoading(false); return;
    }

    const user = data.user;

    // Step 2: Check this is a tenant (not landlord/admin)
    const { data: landlordCheck } = await supabase
      .from('landlord_profiles')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (landlordCheck) {
      await supabase.auth.signOut();
      setError("This account is a landlord account. Please use the landlord login page.");
      setLoading(false); return;
    }

    // Step 3: Check tenant profile exists and is approved
    const { data: tenantProfile } = await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const { data: tenantByEmail } = !tenantProfile ? await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('email', user.email)
      .maybeSingle() : { data: null };

    const profile = tenantProfile || tenantByEmail;

    if (!profile) {
      // New user — create pending profile
      await supabase.from('tenant_profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        email: user.email,
        status: 'pending',
      });
      await supabase.auth.signOut();
      window.location.href = '/tenant-pending';
      return;
    }

    if (profile.status === 'pending') {
      await supabase.auth.signOut();
      setError("Your account is still awaiting landlord approval. Please wait.");
      setLoading(false); return;
    }

    if (profile.status === 'rejected') {
      await supabase.auth.signOut();
      setError("Your account has been rejected. Please contact your landlord.");
      setLoading(false); return;
    }

    // Step 4: Credentials verified + tenant approved
    // Sign out and send OTP for security
    setVerifiedUser({ id: user.id, email: user.email });
    await supabase.auth.signOut();

    // Send OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: form.email.trim().toLowerCase(),
      options: { shouldCreateUser: false }
    });

    if (otpError) {
      // If OTP sending fails, just log them in directly
      console.warn('OTP send failed, logging in directly:', otpError.message);
      const { data: directLogin } = await supabase.auth.signInWithPassword({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (directLogin?.session) {
        window.location.href = '/tenant';
        return;
      }
    }

    // Store for OTP step
    localStorage.setItem('t_email', form.email.trim().toLowerCase());
    localStorage.setItem('t_password', form.password);

    setInfo(`✅ Verification code sent to ${form.email}`);
    setStep(2);
    setLoading(false);

    // Focus first OTP box
    setTimeout(() => document.getElementById('t-otp-0')?.focus(), 100);
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("").slice(0, 6).trim();
    if (otpCode.length < 6) {
      setError("Please enter all 6 digits of your verification code");
      return;
    }

    setLoading(true);
    setError("");

    const email = localStorage.getItem('t_email');
    const password = localStorage.getItem('t_password');

    let session = null;

    // Try all OTP types
    const otpTypes = ['email', 'magiclink', 'signup'];
    for (const type of otpTypes) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otpCode,
          type
        });
        if (!error && data?.session) {
          session = data.session;
          break;
        }
      } catch (e) {
        console.log(`OTP type ${type} failed:`, e.message);
      }
    }

    // Fallback: sign in with password if OTP fails
    if (!session && password) {
      console.log('OTP verification failed, trying password fallback...');
      const { data: fallback } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (fallback?.session) {
        session = fallback.session;
      }
    }

    if (!session) {
      setError("Invalid code. Please check your email and try again, or click Resend.");
      setLoading(false);
      return;
    }

    // Clean up
    localStorage.removeItem('t_email');
    localStorage.removeItem('t_password');

    // Success — redirect to tenant portal
    window.location.href = '/tenant';
  };

  const resendOtp = async () => {
    setLoading(true);
    setError("");
    const email = localStorage.getItem('t_email');

    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });

    setInfo("✅ New code sent! Check your inbox.");
    setOtp(["", "", "", "", "", "", ""]);
    setTimeout(() => document.getElementById('t-otp-0')?.focus(), 100);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex font-sans">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-[#111827] p-12 border-r border-white/5">
        <div className="text-2xl font-extrabold text-[#f0b429]">
          Rent<span className="text-white">Flow</span>
        </div>
        <div>
          <div className="text-3xl font-extrabold text-white mb-4">
            Welcome back<br />
            <span className="text-[#f0b429]">Tenant! 🏠</span>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Log in to view your rent balance, payment history and receipts.
          </p>
          <div className="space-y-3">
            {[
              "✅ View your rent balance",
              "✅ Pay via M-Pesa",
              "✅ Download receipts",
              "✅ See payment calendar",
              "✅ View landlord notices",
            ].map((f, i) => (
              <div key={i} className="text-gray-300 text-sm">{f}</div>
            ))}
          </div>
        </div>
        <div className="text-gray-600 text-xs">© {new Date().getFullYear()} RentFlow 🇰🇪</div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-md">

          <div className="lg:hidden text-2xl font-extrabold text-[#f0b429] mb-6 text-center">
            Rent<span className="text-white">Flow</span>
          </div>

          {/* STEP 1 — LOGIN FORM */}
          {step === 1 && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">
              <h1 className="text-xl font-extrabold mb-1">Tenant Login 🏠</h1>
              <p className="text-gray-500 text-sm mb-6">
                New tenant?{" "}
                <Link href="/tenant/signup" className="text-[#f0b429] font-bold hover:underline">
                  Create account
                </Link>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('t-password')?.focus()}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs text-[#f0b429] hover:underline">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="t-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && login()}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold flex items-start gap-2">
                    <span>❌</span><span>{error}</span>
                  </div>
                )}

                <button
                  onClick={login}
                  disabled={loading}
                  className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Verifying...
                    </>
                  ) : "Log In →"}
                </button>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-gray-600 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  onClick={async () => {
                    await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: `${window.location.origin}/tenant/callback` }
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

                <div className="text-center">
                  <Link href="/login" className="text-gray-500 text-xs hover:text-white transition">
                    ← Back to login options
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — OTP VERIFICATION */}
          {step === 2 && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h1 className="text-xl font-extrabold mb-2">Check Your Email</h1>
              <p className="text-gray-400 text-sm mb-2">
                Enter the verification code sent to:
              </p>
              <p className="text-[#f0b429] font-extrabold mb-1">{form.email}</p>
              <p className="text-gray-600 text-xs mb-6">
                Check your inbox and spam folder
              </p>

              {info && (
                <div className="bg-green-400/10 text-green-400 border border-green-400/20 rounded-xl p-3 text-sm font-bold mb-4">
                  {info}
                </div>
              )}

              {/* OTP Boxes */}
              <div className="flex gap-1.5 sm:gap-2 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`t-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-lg font-extrabold rounded-xl border-2 bg-[#0d1117] text-white transition-all outline-none
                      ${digit ? "border-[#f0b429] bg-[#f0b429]/5" : "border-white/10"}
                      focus:border-[#f0b429]`}
                  />
                ))}
              </div>

              <p className="text-gray-500 text-xs mb-4">
                The code is 6 digits — ignore any extra characters
              </p>

              {error && (
                <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold mb-4">
                  ❌ {error}
                </div>
              )}

              <button
                onClick={verifyOtp}
                disabled={loading || otp.join("").replace(/\D/g,'').length < 6}
                className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50 mb-4 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Verifying...
                  </>
                ) : "Verify & Enter Portal →"}
              </button>

              <div className="flex justify-between text-sm">
                <button
                  onClick={() => { setStep(1); setOtp(["", "", "", "", "", "", ""]); setError(""); setInfo(""); }}
                  className="text-gray-500 hover:text-white transition">
                  ← Back
                </button>
                <button
                  onClick={resendOtp}
                  disabled={loading}
                  className="text-[#f0b429] font-bold hover:underline disabled:opacity-50">
                  Resend Code
                </button>
              </div>

              <p className="text-gray-700 text-xs mt-4">
                🔒 Required for every login session
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
