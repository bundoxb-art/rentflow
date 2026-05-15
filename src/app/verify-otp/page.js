"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  'https://vrelkjytegukqxgustmj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'
)

export default function VerifyOTP() {
  const [method, setMethod] = useState("whatsapp");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const sendOTP = async () => {
    setLoading(true);
    setError("");

    if (method === "whatsapp") {
      if (!phone) { setError("Enter your phone number"); setLoading(false); return; }
      const res = await fetch("/api/whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
        setCountdown(60);
        if (data.debug_otp) setSuccess(`Dev mode OTP: ${data.debug_otp}`);
      } else {
        setError(data.message);
      }
    } else {
      // Supabase email OTP
      if (!email) { setError("Enter your email address"); setLoading(false); return; }
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) { setError(error.message); }
      else { setStep(2); setCountdown(60); setSuccess("Check your email for the OTP code!"); }
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) { setError("Enter all 6 digits"); return; }
    setLoading(true);
    setError("");

    if (method === "whatsapp") {
      const res = await fetch("/api/whatsapp-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpCode })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("✅ Phone verified!");
        setTimeout(() => window.location.href = "/dashboard", 1500);
      } else {
        setError(data.message);
      }
    } else {
      // Supabase email OTP verify
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email"
      });
      if (error) { setError(error.message); }
      else {
        setSuccess("✅ Email verified!");
        setTimeout(() => window.location.href = "/dashboard", 1500);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>
          <p className="text-gray-500 text-sm mt-2">Verify your identity</p>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">

          {step === 1 && (
            <>
              <h1 className="text-xl font-extrabold mb-2 text-center">Verify Your Identity 🔐</h1>
              <p className="text-gray-400 text-sm mb-6 text-center">Choose how you want to receive your code</p>

              {/* Method Toggle */}
              <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-1 flex mb-6">
                {[
                  { key: "whatsapp", icon: "💬", label: "WhatsApp" },
                  { key: "email", icon: "📧", label: "Email OTP" },
                ].map(m => (
                  <button key={m.key} onClick={() => { setMethod(m.key); setError(""); }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2
                      ${method === m.key ? "bg-[#f0b429] text-black" : "text-gray-400 hover:text-white"}`}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>

              {method === "whatsapp" ? (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-gray-400 text-sm flex items-center">🇰🇪 +254</div>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="712 345 678"
                      className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Email Address</label>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" type="email"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                </div>
              )}

              {error && <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold mb-4">{error}</div>}

              <button onClick={sendOTP} disabled={loading}
                className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? "Sending..." : `Send Code via ${method === "whatsapp" ? "WhatsApp 💬" : "Email 📧"} →`}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{method === "whatsapp" ? "💬" : "📧"}</div>
                <h1 className="text-xl font-extrabold mb-2">Enter Your Code</h1>
                <p className="text-gray-400 text-sm">
                  Code sent to <span className="text-[#f0b429] font-bold">{method === "whatsapp" ? phone : email}</span>
                </p>
              </div>

              {success && <div className="bg-green-400/10 text-green-400 border border-green-400/20 rounded-xl p-3 text-sm font-bold mb-4 text-center">{success}</div>}

              {/* OTP Boxes */}
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((digit, i) => (
                  <input key={i} ref={el => inputs.current[i] = el}
                    type="text" maxLength={1} value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-11 h-14 text-center text-xl font-extrabold rounded-xl border-2 bg-[#0d1117] text-white transition-all outline-none
                      ${digit ? "border-[#f0b429]" : "border-white/10"} focus:border-[#f0b429]`} />
                ))}
              </div>

              {error && <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold mb-4 text-center">{error}</div>}

              <button onClick={verifyOTP} disabled={loading || otp.join("").length !== 6}
                className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50 mb-4">
                {loading ? "Verifying..." : "Verify Code →"}
              </button>

              <div className="text-center text-sm text-gray-500">
                {countdown > 0 ? (
                  <span>Resend in <span className="text-[#f0b429] font-bold">{countdown}s</span></span>
                ) : (
                  <button onClick={() => { setStep(1); setOtp(["","","","","",""]); setSuccess(""); }}
                    className="text-[#f0b429] font-bold hover:underline">
                    ← Try Again
                  </button>
                )}
              </div>
            </>
          )}

          <p className="text-center text-gray-600 text-xs mt-6">
            <Link href="/auth" className="hover:text-gray-400 transition">← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}