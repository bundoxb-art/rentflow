"use client";
import Link from "next/link";

export default function Reports() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex">
      <aside className="w-60 bg-[#111827] border-r border-white/5 flex flex-col py-6 flex-shrink-0">
        <div className="px-6 mb-8">
          <div className="text-xl font-extrabold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {[
            { icon: "📊", label: "Dashboard", href: "/dashboard" },
            { icon: "🏢", label: "Properties", href: "/dashboard/properties" },
            { icon: "👥", label: "Tenants", href: "/dashboard/tenants" },
            { icon: "💳", label: "Payments", href: "/dashboard/payments" },
            { icon: "🔔", label: "Reminders", href: "/dashboard/reminders" },
            { icon: "📄", label: "Reports", href: "/dashboard/reports", active: true },
            { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
          ].map((n, i) => (
            <Link key={i} href={n.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${n.active ? "bg-[#f0b429]/10 text-[#f0b429]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              <span className="text-lg">{n.icon}</span><span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="text-6xl mb-4">📄</div>
        <h1 className="text-2xl font-extrabold mb-2">Reports</h1>
        <p className="text-gray-500 mb-6">Monthly income reports and PDF exports coming soon!</p>
        <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-6 max-w-md">
          <div className="text-[#f0b429] font-bold mb-2">🚀 Coming in Next Update</div>
          <p className="text-gray-400 text-sm">Download monthly PDF reports showing total income, paid tenants, outstanding balances and collection rates per property.</p>
        </div>
      </main>
    </div>
  );
}