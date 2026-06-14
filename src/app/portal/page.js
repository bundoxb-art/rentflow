"use client";
import Link from "next/link";

export default function PortalSelector() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-4xl font-extrabold text-[#f0b429]">
            RentFlow <span className="text-white">Pro</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Staff & Management Access</p>
        </div>

        <div className="space-y-4">

          {/* Manager */}
          <Link href="/manage/login"
            className="block bg-[#111827] border-2 border-white/10 hover:border-[#f0b429]/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#f0b429]/10 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                👔
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-lg group-hover:text-[#f0b429] transition">Manager</div>
                <div className="text-gray-400 text-sm mt-0.5">Owner portal — manage apartments, super admins & system-wide revenue</div>
              </div>
              <div className="text-gray-600 group-hover:text-[#f0b429] transition text-xl">→</div>
            </div>
          </Link>

          {/* Super Admin */}
          <Link href="/superadmin/login"
            className="block bg-[#111827] border-2 border-white/10 hover:border-purple-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                👑
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-lg group-hover:text-purple-400 transition">Super Admin</div>
                <div className="text-gray-400 text-sm mt-0.5">Oversee all apartments, assign apartment admins & monitor revenue</div>
              </div>
              <div className="text-gray-600 group-hover:text-purple-400 transition text-xl">→</div>
            </div>
          </Link>

          {/* Apartment Admin */}
          <Link href="/apartmentadmin/login"
            className="block bg-[#111827] border-2 border-white/10 hover:border-blue-500/50 rounded-2xl p-6 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                🏛️
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-lg group-hover:text-blue-400 transition">Apartment Admin</div>
                <div className="text-gray-400 text-sm mt-0.5">Manage your assigned apartment — landlords, tenants & reports</div>
              </div>
              <div className="text-gray-600 group-hover:text-blue-400 transition text-xl">→</div>
            </div>
          </Link>

          {/* Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">looking for something else?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Back to main site */}
          <Link href="/"
            className="block text-center text-gray-500 text-sm hover:text-white transition py-2">
            ← Back to main site
          </Link>
        </div>

        <p className="text-center text-gray-700 text-xs mt-8">
          🔒 All portals require email verification (OTP) on every login
        </p>
      </div>
    </div>
  );
}