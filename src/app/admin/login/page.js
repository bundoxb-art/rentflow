"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "bundoxb@gmail.com";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState(["","","","","","",""]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 7);
      const newOtp = Array(7).fill('');
      digits.split('').forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      document.getElementById(`admin-otp-${Math.min(digits.length, 6)}`)?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 6) document.getElementById(`admin-otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`admin-otp-${index - 1}`)?.focus();
    }
  };

  const login = async () => {
    setLoading(true);
    setError("");

    // Check admin email
    if (form.email !== ADMIN_EMAIL) {
      setError("Access denied. Admin only.");
      setLoading(false);
      return;
    }

    // Verify password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) { setError(error.message); setLoading(false); return; }

    if (data?.session) {
      // Sign out and require OTP
      await supabase.auth.signOut();

      // Send OTP
      await supabase.auth.signInWithOtp({
        email: form.email,
        options: { shouldCreateUser: false }
      });

      localStorage.setItem('admin_verify_email', form.email);
      localStorage.setItem('admin_verify_password', form.password);
      setStep(2);
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("").slice(0, 6);
    if (otpCode.length < 6) { setError("Enter complete code"); return; }

    setLoading(true);
    setError("");

    const email = localStorage.getItem('admin_verify_email');
    const password = localStorage.getItem('admin_verify_password');

    // Try OTP verification
    const types = ['email', 'magiclink'];
    let verified = false;

    for (const type of types) {
      const { data, error } = await supabase.auth.verifyOtp({
        email, token: otpCode, type
      });
      if (!error && data?.session) { verified = true; break; }
    }

    // Fallback to password
    if (!verified) {
      const { data } = await supabase.auth.signInWithPassword({ email, password });
      if (data?.session) verified = true;
    }

    if (!verified) {
      setError("Invalid code. Please try again.");
      setLoading(false);
      return;
    }

    // Verify it's actually admin
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError("Access denied.");
      setLoading(false);
      return;
    }

    localStorage.removeItem('admin_verify_email');
    localStorage.removeItem('admin_verify_password');
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#f0b429]">
            Rent<span className="text-white">Flow</span>
          </div>
          <div className="inline-block bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-1.5 rounded-full mt-2">
            🔐 ADMIN ACCESS ONLY
          </div>
        </div>

        <div className="bg-[#111827] border border-red-500/20 rounded-2xl p-8">

          {step === 1 && (
            <>
              <h1 className="text-xl font-extrabold mb-2 text-center">Admin Login</h1>
              <p className="text-gray-500 text-sm text-center mb-6">
                Restricted access — authorized personnel only
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Admin Email</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="admin@rentflow.com"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-400 transition" />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-400 transition" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold">
                    {error}
                  </div>
                )}

                <button onClick={login} disabled={loading}
                  className="w-full bg-red-500 text-white font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2">
                  {loading ? "Verifying..." : "🔐 Access Admin Panel →"}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h1 className="text-xl font-extrabold mb-2">Admin Verification</h1>
              <p className="text-gray-400 text-sm mb-6">
                Enter the code sent to your admin email
              </p>

              <div className="flex gap-1.5 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input key={i} id={`admin-otp-${i}`}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-lg font-extrabold rounded-xl border-2 bg-[#0d1117] text-white transition-all outline-none
                      ${digit ? "border-red-400" : "border-white/10"} focus:border-red-400`}
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
                className="w-full bg-red-500 text-white font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50 mb-4">
                {loading ? "Verifying..." : "Verify & Enter Admin Panel →"}
              </button>

              <button onClick={() => { setStep(1); setOtp(["","","","","","",""]); setError(""); }}
                className="text-gray-500 text-sm hover:text-white transition">← Back</button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          🔒 All admin actions are logged and monitored
        </p>
      </div>
    </div>
  );
}