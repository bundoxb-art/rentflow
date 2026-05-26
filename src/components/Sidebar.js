"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

// Bottom nav for mobile (show only main items)
const mobileNavItems = [
  { icon: "📊", label: "Home", href: "/dashboard" },
  { icon: "👥", label: "Tenants", href: "/dashboard/tenants" },
  { icon: "💳", label: "Payments", href: "/dashboard/payments" },
  { icon: "📅", label: "Calendar", href: "/dashboard/calendar" },
  { icon: "⚙️", label: "More", href: "/dashboard/settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-white/10 flex md:hidden z-50 safe-area-pb">
      {mobileNavItems.map((n, i) => {
        const active = pathname === n.href;
        return (
          <Link key={i} href={n.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-all ${active ? "text-[#f0b429]" : "text-gray-500"}`}>
            <span className="text-xl mb-0.5">{n.icon}</span>
            <span className="text-[10px]">{n.label}</span>
            {active && <div className="absolute top-0 w-8 h-0.5 bg-[#f0b429] rounded-full" />}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-60 bg-[#111827] border-r border-white/5 flex-col py-6 flex-shrink-0 min-h-screen transition-all duration-300">
        <div className="px-3 lg:px-6 mb-8">
          <div className="text-xl font-extrabold text-[#f0b429] hidden lg:block">
            Rent<span className="text-white">Flow</span>
          </div>
          <div className="text-xl font-extrabold text-[#f0b429] lg:hidden text-center">R</div>
        </div>
        <nav className="flex flex-col gap-1 px-2 flex-1">
          {navItems.map((n, i) => {
            const active = pathname === n.href;
            return (
              <Link key={i} href={n.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${active ? "bg-[#f0b429]/10 text-[#f0b429]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
                <span className="text-lg flex-shrink-0">{n.icon}</span>
                <span className="hidden lg:block">{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </>
  );
}