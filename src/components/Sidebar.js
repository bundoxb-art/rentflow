"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: "📊", label: "Dashboard", href: "/dashboard" },
    { icon: "🏢", label: "Properties", href: "/dashboard/properties" },
    { icon: "👥", label: "Tenants", href: "/dashboard/tenants" },
    { icon: "💳", label: "Payments", href: "/dashboard/payments" },
    { icon: "📅", label: "Calendar", href: "/dashboard/calendar" },
    { icon: "🔔", label: "Reminders", href: "/dashboard/reminders" },
    { icon: "📄", label: "Reports", href: "/dashboard/reports" },
    { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <aside className="w-60 bg-[#111827] border-r border-white/5 flex flex-col py-6 flex-shrink-0 min-h-screen">
      <div className="px-6 mb-8">
        <div className="text-xl font-extrabold text-[#f0b429]">
          Rent<span className="text-white">Flow</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {navItems.map((n, i) => {
          const active = pathname === n.href;
          return (
            <Link key={i} href={n.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${active ? "bg-[#f0b429]/10 text-[#f0b429]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              <span className="text-lg">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}