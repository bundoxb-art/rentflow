"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex">
      <aside className="w-60 bg-[#111827] border-r border-white/5 flex flex-col py-6 flex-shrink-0">
        <div className="px-6 mb-8">
          <div className="text-xl font-extrabold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>
        </div>
        <nav className="flex flex-col gap-1 px-2 flex-1">
          {[
            { icon: "📊", label: "Dashboard", href: "/dashboard" },
            { icon: "🏢", label: "Properties", href: "/dashboard/properties" },
            { icon: "👥", label: "Tenants", href: "/dashboard/tenants" },
            { icon: "💳", label: "Payments", href: "/dashboard/payments" },
            { icon: "🔔", label: "Reminders", href: "/dashboard/reminders" },
            { icon: "📄", label: "Reports", href: "/dashboard/reports" },
            { icon: "⚙️", label: "Settings", href: "/dashboard/settings", active: true },
          ].map((n, i) => (
            <Link key={i} href={n.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${n.active ? "bg-[#f0b429]/10 text-[#f0b429]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              <span className="text-lg">{n.icon}</span><span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
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

      <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}