"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function HandleAuth() {
  useEffect(() => {
    // Handle the hash token from URL
    const handleAuth = async () => {
      const hash = window.location.hash;
      
      if (hash && hash.includes('access_token')) {
        // Wait for Supabase to process the hash
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.location.href = '/dashboard';
          return;
        }
      }

      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/auth';
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🔐</div>
        <div className="text-white font-bold text-lg mb-2">Logging you in...</div>
        <div className="text-gray-500 text-sm">Please wait a moment</div>
        <div className="mt-4 flex gap-1 justify-center">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 bg-[#f0b429] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}