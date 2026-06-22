"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TenantPending() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let channel;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/tenant/login'; return; }

      // Check immediately in case already approved
      const { data: profile } = await supabase
        .from('tenant_profiles').select('status').eq('id', user.id).single();

      if (profile?.status === 'approved') {
        window.location.href = '/tenant';
        return;
      }
      setChecking(false);

      // Listen for live status change
      channel = supabase
        .channel('tenant-status-' + user.id)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tenant_profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            if (payload.new.status === 'approved') {
              window.location.href = '/tenant';
            }
          }
        )
        .subscribe();
    };
    init();

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

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
            Your landlord has been notified. This page will update automatically the moment you're approved — no need to refresh.
          </p>
          <div className="flex justify-center gap-1 mb-6">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-[#f0b429] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.href = '/tenant/login'; }}
            className="w-full bg-white/5 text-gray-400 font-bold py-3 rounded-xl text-sm hover:bg-white/10 transition">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}