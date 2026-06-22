"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ManagerLogin() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState(["","","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('registered=true')) {
      setRegistered(true);
    }
  }, []);

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

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const login = async () => {
    setLoading(true);
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      setLoading(false); return;
    }

    // Verify credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false); return;
    }

    if (data?.session) {
      // Check if manager record exists
      const { data: manager, error: mgrError } = await supabase
        .from('managers')
        .select('*')
        .eq('email', form.email.trim().toLowerCase())
        .maybeSingle();

      if (mgrError) {
        console.error('Manager check error:', mgrError);
      }

      if (!manager) {
        // Check by user ID as fallback
        const { data: mgrById } = await supabase
          .from('managers')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!mgrById) {
          await supabase.auth.signOut();
          setError("No manager account found. Please register first or contact support.");
          setLoading(false); return;
        }
      }

      if (manager?.status === 'suspended') {
        await supabase.auth.signOut();
        setError("Your account has been suspended. Contact support.");
        setLoading(false); return;
      }

      // Sign out and send OTP
      await supabase.auth.signOut();
      await supabase.auth.signInWithOtp({
        email: form.email.trim().toLowerCase(),
        options: { shouldCreateUser: false }
      });

      localStorage.setItem('mgr_email', form.email.trim().toLowerCase());
      localStorage.setItem('mgr_password', form.password);
      setStep(2);
    }
    setLoading(false);
  };

  const verify = async () => {
    const otpCode = otp.join("").slice(0, 6);
    if (otpCode.length < 6) { setError("Enter complete code"); return; }

    setLoading(true);
    setError("");

    const email = localStorage.getItem('mgr_email');
    const password = localStorage.getItem('mgr_password');

    let verified = false;
    for (const type of ['email', 'magiclink']) {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type });
      if (!error && data?.session) { verified = true; break; }
    }

    if (!verified) {
      const { data } = await supabase.auth.signInWithPassword({ email, password });
      if (data?.session) verified = true;
    }

    if (!verified) {
      setError("Invalid code. Please try again.");
      setLoading(false); return;
    }

    // Log last login
    await supabase.from('managers')
      .update({ last_login: new Date().toISOString() })
      .eq('email', email);

    // Log audit
    await supabase.from('audit_logs').insert({
      user_email: email,
      role: 'manager',
      action: 'LOGIN',
      table_name: 'managers',
    });

    localStorage.removeItem('mgr_email');
    localStorage.removeItem('mgr_password');
    window.location.href = '/manage';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#f0b429]">
            RentFlow <span className="text-white">Pro</span>
          </div>
          <div className="inline-block bg-[#f0b429]/10 border border-[#f0b429]/20 text-[#f0b429] text-xs font-bold px-4 py-1.5 rounded-full mt-2">
            🏢 MANAGEMENT PORTAL
          </div>
        </div>

        <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-8">
          {step === 1 && (
            <>
              <h1 className="text-xl font-extrabold mb-1 text-center">Manager Login</h1>
              <p className="text-gray-500 text-xs text-center mb-6">Restricted access — authorized managers only</p>

              <div className="space-y-4">
                {registered && (
                  <div className="bg-green-400/10 text-green-400 border border-green-400/20 rounded-xl p-3 text-sm font-bold mb-4">
                    ✅ Account created! Please log in to continue.
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Email</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="manager@company.com"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold">{error}</div>}

                <button onClick={login} disabled={loading}
                  className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70">
                  {loading ? "Verifying..." : "Access Manager Portal →"}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h1 className="text-xl font-extrabold mb-2">Verify Identity</h1>
              <p className="text-gray-400 text-sm mb-6">Enter the 6-digit code sent to your email</p>

              <div className="flex gap-1.5 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-lg font-extrabold rounded-xl border-2 bg-[#0d1117] text-white transition-all outline-none ${digit ? "border-[#f0b429]" : "border-white/10"} focus:border-[#f0b429]`}
                  />
                ))}
              </div>

              {error && <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold mb-4">{error}</div>}

              <button onClick={verify}
                disabled={loading || otp.join("").replace(/\s/g,'').length < 6}
                className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50 mb-4">
                {loading ? "Verifying..." : "Verify & Enter →"}
              </button>

              <button onClick={() => { setStep(1); setOtp(["","","","","","",""]); setError(""); }}
                className="text-gray-500 text-sm hover:text-white transition">← Back</button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">
          🔒 This portal is not publicly accessible
        </p>
      </div>
    </div>
  );
}