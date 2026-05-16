"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleReset = async () => {
    if (!password) { setError("Please enter a new password"); return; }
    if (password !== confirm) { setError("Passwords don't match!"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("✅ Password updated successfully!");
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#f0b429]">
            Rent<span className="text-white">Flow</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Create a new password</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-extrabold mb-2">Set New Password 🔐</h1>
          <p className="text-gray-400 text-sm mb-6">
            Enter your new password below.
          </p>

          <div className="mb-4">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition"
            />
          </div>

          {error && (
            <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-400/10 text-green-400 border border-green-400/20 rounded-xl p-3 text-sm font-bold mb-4">
              {message}
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Updating...
              </>
            ) : "Update Password →"}
          </button>
        </div>
      </div>
    </div>
  );
}