"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";

function VerifyOTPContent() {
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(["","","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("tenant");
  const [mode, setMode] = useState("login");
  const inputs = useRef([]);

  useEffect(() => {
    // Get from URL params first, then localStorage
    const urlEmail = searchParams.get('email');
    const urlRole = searchParams.get('role');
    const urlMode = searchParams.get('mode');

    const storedEmail = localStorage.getItem('rentflow_verify_email');
    const storedRole = localStorage.getItem('rentflow_verify_role');
    const storedMode = localStorage.getItem('rentflow_verify_mode');

    setEmail(urlEmail || storedEmail || "");
    setRole(urlRole || storedRole || "tenant");
    setMode(urlMode || storedMode || "login");

    if (!urlEmail && !storedEmail) {
      window.location.href = '/login';
      return;
    }

    // Focus first input
    setTimeout(() => inputs.current[0]?.focus(), 100);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    // Handle paste
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 7);
      const newOtp = Array(7).fill('');
      digits.split('').forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      inputs.current[Math.min(digits.length, 6)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 6) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = async () => {
    const otpCode = otp.join("").replace(/\s/g,'').slice(0, 6);
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    const password = localStorage.getItem('rentflow_verify_password');

    // Try different OTP types
    const types = mode === 'signup' ? ['signup', 'email'] : ['email', 'magiclink'];
    let verified = false;
    let session = null;

    for (const type of types) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type
      });
      if (!error && data?.session) {
        verified = true;
        session = data.session;
        break;
      }
    }

    // Fallback - re-signin with password
    if (!verified && password) {
      const { data } = await supabase.auth.signInWithPassword({ email, password });
      if (data?.session) {
        verified = true;
        session = data.session;
      }
    }

    if (!verified) {
      setError("Invalid or expired code. Please try again.");
      setLoading(false);
      return;
    }

    // Log OTP verification
    await supabase.from('otp_logs').insert({
      email,
      role,
      verified: true,
      verified_at: new Date().toISOString()
    });

    // Clear stored data
    localStorage.removeItem('rentflow_verify_email');
    localStorage.removeItem('rentflow_verify_password');
    localStorage.removeItem('rentflow_verify_role');
    localStorage.removeItem('rentflow_verify_mode');

    // Get user profile and redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Log session
      if (profile?.role === 'landlord') {
        await supabase.from('landlord_sessions').insert({
          landlord_id: user.id,
          email: user.email,
          last_login: new Date().toISOString()
        });
      } else {
        await supabase.from('tenant_sessions').insert({
          tenant_id: user.id,
          email: user.email,
          last_login: new Date().toISOString()
        });
      }

      // Check status
      if (profile?.role === 'landlord' && profile?.status === 'pending') {
        window.location.href = '/pending-approval';
        return;
      }

      if (profile?.role === 'landlord' && profile?.status === 'suspended') {
        await supabase.auth.signOut();
        setError("Your account has been suspended. Contact admin.");
        setLoading(false);
        return;
      }

      if (profile?.role === 'tenant' && profile?.status === 'pending') {
        window.location.href = '/tenant-pending';
        return;
      }

      if (mode === 'signup' && profile?.role === 'tenant') {
        window.location.href = '/tenant-pending';
        return;
      }

      // Redirect based on role
      window.location.href = profile?.role === 'landlord' ? '/dashboard' : '/tenant';
      return;
    }

    window.location.href = role === 'landlord' ? '/dashboard' : '/tenant';
  };

  const resend = async () => {
    setResending(true);
    setError("");

    if (mode === 'signup') {
      await supabase.auth.resend({ type: 'signup', email });
    } else {
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
      });
    }

    setSuccess("✅ New code sent!");
    setOtp(["","","","","","",""]);
    setCountdown(60);
    setTimeout(() => setSuccess(""), 3000);
    inputs.current[0]?.focus();
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#f0b429]">
            Rent<span className="text-white">Flow</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">Security Verification</p>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-extrabold mb-2">Verify Your Identity</h1>
            <p className="text-gray-400 text-sm mb-1">
              We sent a security code to:
            </p>
            <p className="text-[#f0b429] font-extrabold">{email}</p>
            <p className="text-gray-500 text-xs mt-1">Check your inbox and spam folder</p>
          </div>

          {/* Role Badge */}
          <div className="flex justify-center mb-6">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
              role === 'landlord' ? 'bg-[#f0b429]/10 text-[#f0b429] border border-[#f0b429]/20' :
              role === 'admin' ? 'bg-red-400/10 text-red-400 border border-red-400/20' :
              'bg-blue-400/10 text-blue-400 border border-blue-400/20'
            }`}>
              {role === 'landlord' ? '🏢 Landlord' : role === 'admin' ? '🔴 Admin' : '🏠 Tenant'}
            </div>
          </div>

          {success && (
            <div className="bg-green-400/10 text-green-400 border border-green-400/20 rounded-xl p-3 text-sm font-bold mb-4 text-center">
              {success}
            </div>
          )}

          {/* OTP Input */}
          <div className="flex gap-1.5 sm:gap-2 justify-center mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-9 h-12 sm:w-11 sm:h-14 text-center text-lg font-extrabold rounded-xl border-2 bg-[#0d1117] text-white transition-all outline-none
                  ${digit ? "border-[#f0b429]" : "border-white/10"} focus:border-[#f0b429]`}
              />
            ))}
          </div>

          <p className="text-center text-gray-500 text-xs mb-4">
            💡 Tip: You can paste the code directly into the boxes
          </p>

          {error && (
            <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold mb-4 text-center">
              {error}
            </div>
          )}

          <button onClick={verify}
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

          <div className="flex justify-between items-center text-sm">
            <button
              onClick={() => {
                localStorage.removeItem('rentflow_verify_email');
                localStorage.removeItem('rentflow_verify_password');
                localStorage.removeItem('rentflow_verify_role');
                localStorage.removeItem('rentflow_verify_mode');
                window.location.href = '/login';
              }}
              className="text-gray-500 hover:text-white transition text-xs">
              ← Back to Login
            </button>
            <div>
              {countdown > 0 ? (
                <span className="text-gray-500 text-xs">
                  Resend in <span className="text-[#f0b429] font-bold">{countdown}s</span>
                </span>
              ) : (
                <button onClick={resend} disabled={resending}
                  className="text-[#f0b429] font-bold text-xs hover:underline disabled:opacity-50">
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-4">
            🔒 A new code is required for every login session
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTP() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-[#f0b429] text-2xl font-extrabold animate-pulse">RentFlow</div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}