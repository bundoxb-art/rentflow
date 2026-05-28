"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar, { BottomNav } from "@/components/Sidebar";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState("");
  const router = useRouter();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex font-sans">
      
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="sticky top-0 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 px-8 py-4">
          <h1 className="text-xl font-extrabold">Settings</h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage your account</p>
        </div>

        <div className="px-8 py-6 max-w-2xl">
          {/* Profile */}
          <div className="bg-[#111827] border border-white/5 rounded-2xl p-6 mb-4">
            <h2 className="font-extrabold text-lg mb-4">👤 Profile</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-[#f0b429] flex items-center justify-center text-black font-extrabold text-2xl">
                {(user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-extrabold text-lg">{user?.user_metadata?.full_name || "—"}</div>
                <div className="text-gray-500 text-sm">{user?.email}</div>
                <div className="text-[#f0b429] text-xs font-bold mt-1 uppercase">{user?.user_metadata?.role || "Landlord"}</div>
              </div>
            </div>
            {[
              ["Full Name", user?.user_metadata?.full_name || "—"],
              ["Email", user?.email || "—"],
              ["Phone", user?.user_metadata?.phone || "—"],
              ["Role", user?.user_metadata?.role || "Landlord"],
              ["Account Created", user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-3 border-b border-white/5 text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>

          {user?.email === 'bundoxb@gmail.com' && (
            <div className="bg-[#111827] border border-red-400/20 rounded-2xl p-6 mb-4">
              <h2 className="font-extrabold text-lg mb-4 text-red-400">🔐 Admin Access</h2>
              <a href="/admin"
                className="block w-full bg-red-500/10 text-red-400 border border-red-400/20 font-extrabold py-3 rounded-xl text-sm hover:bg-red-500/20 transition text-center">
                → Open Admin Panel
              </a>
              <a href="/admin/create-landlord"
                className="block w-full bg-red-500/10 text-red-400 border border-red-400/20 font-extrabold py-3 rounded-xl text-sm hover:bg-red-500/20 transition text-center mt-2">
                → Create Landlord Account
              </a>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-[#111827] border border-red-400/20 rounded-2xl p-6">
            <h2 className="font-extrabold text-lg mb-4 text-red-400">⚠️ Account</h2>
            <button onClick={logout}
              className="w-full bg-red-400/10 text-red-400 border border-red-400/20 font-extrabold py-3 rounded-xl text-sm hover:bg-red-400/20 transition">
              🚪 Log Out
            </button>
          </div>
        </div>
      </main>

      <div className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-[#f0b429] text-black font-extrabold px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm z-[100] transition-all duration-300 max-w-xs ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}