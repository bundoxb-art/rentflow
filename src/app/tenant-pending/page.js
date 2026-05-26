"use client";
import { supabase } from "@/lib/supabase";

export default function TenantPending() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md text-center">
        <div className="text-3xl font-extrabold text-[#f0b429] mb-8">
          Rent<span className="text-white">Flow</span>
        </div>
        <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-8">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-extrabold mb-3">Request Sent!</h1>
          <p className="text-gray-400 text-sm mb-6">
            Your tenant account request has been sent to your landlord for approval.
            You will receive an email once approved!
          </p>
          <div className="bg-[#0d1117] rounded-2xl p-4 mb-6 text-left space-y-3">
            {[
              "✅ Account created successfully",
              "✅ Email verified",
              "⏳ Waiting for landlord approval",
              "📧 You'll get an email when approved",
              "🏠 Then you can access your tenant portal",
            ].map((step, i) => (
              <div key={i} className="text-sm text-gray-300">{step}</div>
            ))}
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/auth';
            }}
            className="w-full bg-white/5 text-gray-400 font-bold py-3 rounded-xl text-sm hover:bg-white/10 transition">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}