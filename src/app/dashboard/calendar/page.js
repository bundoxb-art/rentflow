"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  'https://vrelkjytegukqxgustmj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZWxranl0ZWd1a3F4Z3VzdG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NTkxNzIsImV4cCI6MjA5NDAzNTE3Mn0.O1HvYi0HuUDhczCoDRssWCC6gx7tbMmhkG3NG8H0zyw'
)

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const fmt = (n) => "KSh " + (n || 0).toLocaleString();

export default function Calendar() {
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTenants, setSelectedTenants] = useState([]);

  useEffect(() => {
    fetchData();

    // Real-time subscription — auto updates when tenant pays!
    const subscription = supabase
      .channel('tenants-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tenants' },
        (payload) => {
          console.log('Tenant updated:', payload);
          fetchData(); // Refresh data automatically!
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment received:', payload);
          fetchData(); // Refresh data automatically!
        }
      )
      .subscribe();

    // Cleanup subscription when page closes
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: t } = await supabase.from("tenants").select("*");
    const { data: p } = await supabase.from("payments").select("*");
    setTenants(t || []);
    setPayments(p || []);
    setLoading(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Due date is 1st of every month
  const dueDay = 1;

  const paidTenants = tenants.filter(t => t.status === "paid");
  const unpaidTenants = tenants.filter(t => t.status !== "paid");

  const handleDayClick = (day) => {
    setSelectedDay(day);
    if (day === dueDay) {
      setSelectedTenants(tenants);
    } else {
      setSelectedTenants([]);
    }
  };

  const getDayStatus = (day) => {
    if (day !== dueDay) return null;
    const today = new Date();
    const isOverdue = new Date(year, month, day) < today;
    if (unpaidTenants.length === 0) return "all-paid";
    if (isOverdue) return "overdue";
    return "due";
  };

  const totalRent = tenants.reduce((s, t) => s + (t.rent_amount || 0), 0);
  const totalPaid = paidTenants.reduce((s, t) => s + (t.rent_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans flex">

      {/* SIDEBAR */}
      <aside className="w-60 bg-[#111827] border-r border-white/5 flex-col py-6 flex-shrink-0 hidden md:flex">
        <div className="px-6 mb-8">
          <div className="text-xl font-extrabold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>
        </div>
        <nav className="flex flex-col gap-1 px-2 flex-1">
          {[
            { icon: "📊", label: "Dashboard", href: "/dashboard" },
            { icon: "🏢", label: "Properties", href: "/dashboard/properties" },
            { icon: "👥", label: "Tenants", href: "/dashboard/tenants" },
            { icon: "💳", label: "Payments", href: "/dashboard/payments" },
            { icon: "📅", label: "Calendar", href: "/dashboard/calendar", active: true },
            { icon: "🔔", label: "Reminders", href: "/dashboard/reminders" },
            { icon: "📄", label: "Reports", href: "/dashboard/reports" },
            { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
          ].map((n, i) => (
            <Link key={i} href={n.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${n.active ? "bg-[#f0b429]/10 text-[#f0b429]" : "text-gray-500 hover:text-white hover:bg-white/5"}`}>
              <span className="text-lg">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 mt-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#f0b429] flex items-center justify-center text-black font-bold text-sm">JM</div>
          <div><div className="text-sm font-bold">John Mutua</div><div className="text-xs text-gray-500">Landlord</div></div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 px-4 sm:px-8 py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold">Rent Calendar</h1>
            <p className="text-gray-500 text-xs mt-0.5">Track payment due dates and status</p>
          </div>
          <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm transition">
            ← Dashboard
          </Link>
        </div>

        <div className="px-4 sm:px-8 py-6">

          {/* STATS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Total Tenants", value: tenants.length, color: "#f0b429", icon: "👥" },
              { label: "Paid", value: paidTenants.length, color: "#4ade80", icon: "✅" },
              { label: "Unpaid", value: unpaidTenants.length, color: "#f87171", icon: "❌" },
              { label: "Collected", value: fmt(totalPaid), color: "#4ade80", icon: "💰" },
            ].map((s, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-4" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
                  <div>{s.icon}</div>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* CALENDAR */}
            <div className="lg:col-span-2 bg-[#111827] border border-white/5 rounded-2xl p-4 sm:p-6">

              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <button onClick={prevMonth} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition text-lg">
                  ←
                </button>
                <h2 className="text-lg sm:text-xl font-extrabold">
                  {MONTHS[month]} {year}
                </h2>
                <button onClick={nextMonth} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition text-lg">
                  →
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-500 py-2">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Previous month days */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`prev-${i}`} className="aspect-square flex items-center justify-center text-xs text-gray-700 rounded-xl">
                    {daysInPrevMonth - firstDay + i + 1}
                  </div>
                ))}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const status = getDayStatus(day);
                  const today = new Date();
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const isSelected = selectedDay === day;

                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square flex flex-col items-center justify-center text-xs rounded-xl transition-all relative
                        ${isSelected ? "ring-2 ring-[#f0b429]" : ""}
                        ${isToday && !status ? "bg-white/10 font-extrabold" : ""}
                        ${status === "all-paid" ? "bg-green-400/20 hover:bg-green-400/30" : ""}
                        ${status === "overdue" ? "bg-red-400/20 hover:bg-red-400/30" : ""}
                        ${status === "due" ? "bg-yellow-400/20 hover:bg-yellow-400/30" : ""}
                        ${!status && !isToday ? "hover:bg-white/5" : ""}
                      `}
                    >
                      <span className={`font-bold text-sm
                        ${status === "all-paid" ? "text-green-400" : ""}
                        ${status === "overdue" ? "text-red-400" : ""}
                        ${status === "due" ? "text-yellow-400" : ""}
                        ${isToday && !status ? "text-[#f0b429]" : ""}
                      `}>
                        {day}
                      </span>
                      {status && (
                        <span className="text-[8px] mt-0.5 hidden sm:block">
                          {status === "all-paid" ? "✓ paid" : status === "overdue" ? "overdue" : "due"}
                        </span>
                      )}
                      {isToday && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#f0b429]" />
                      )}
                    </button>
                  );
                })}

                {/* Next month days */}
                {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }, (_, i) => (
                  <div key={`next-${i}`} className="aspect-square flex items-center justify-center text-xs text-gray-700 rounded-xl">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 pt-4 border-t border-white/5">
                {[
                  { color: "bg-green-400/20 text-green-400", label: "All Paid" },
                  { color: "bg-red-400/20 text-red-400", label: "Overdue" },
                  { color: "bg-yellow-400/20 text-yellow-400", label: "Due Soon" },
                  { color: "bg-white/10 text-[#f0b429]", label: "Today" },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${l.color.split(" ")[0]}`} />
                    <span className={`text-xs ${l.color.split(" ")[1]}`}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="space-y-4">

              {/* Selected Day Info */}
              {selectedDay && (
                <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-5">
                  <div className="font-extrabold text-lg mb-1">
                    {MONTHS[month]} {selectedDay}, {year}
                  </div>
                  {selectedDay === dueDay ? (
                    <>
                      <div className="text-xs text-gray-500 mb-4">Rent Due Date</div>
                      <div className="space-y-3">
                        {tenants.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-[#0d1117] rounded-xl">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#f0b429]/20 text-[#f0b429] flex items-center justify-center text-xs font-bold">
                                {t.name?.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <div className="text-xs font-bold">{t.name}</div>
                                <div className="text-xs text-gray-500">Unit {t.unit}</div>
                              </div>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status === "paid" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                              {t.status === "paid" ? "✓ Paid" : "Unpaid"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 text-sm">No rent due on this day</div>
                  )}
                </div>
              )}

              {/* Monthly Summary */}
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                <div className="font-extrabold mb-4">📊 {MONTHS[month]} Summary</div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expected</span>
                    <span className="font-bold text-[#f0b429]">{fmt(totalRent)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Collected</span>
                    <span className="font-bold text-green-400">{fmt(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Outstanding</span>
                    <span className="font-bold text-red-400">{fmt(totalRent - totalPaid)}</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Due Date</span>
                    <span className="font-bold">1st of month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Paid Tenants</span>
                    <span className="font-bold text-green-400">{paidTenants.length}/{tenants.length}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Collection Progress</span>
                    <span>{totalRent > 0 ? Math.round((totalPaid/totalRent)*100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-400 transition-all"
                      style={{ width: `${totalRent > 0 ? Math.round((totalPaid/totalRent)*100) : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Unpaid Tenants */}
              {unpaidTenants.length > 0 && (
                <div className="bg-[#111827] border border-red-400/20 rounded-2xl p-5">
                  <div className="font-extrabold mb-3 text-red-400">⚠️ Unpaid ({unpaidTenants.length})</div>
                  <div className="space-y-2">
                    {unpaidTenants.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-[#0d1117] rounded-xl">
                        <div>
                          <div className="text-xs font-bold">{t.name}</div>
                          <div className="text-xs text-gray-500">{fmt(t.rent_amount)}</div>
                        </div>
                        <span className="text-xs bg-red-400/10 text-red-400 px-2 py-1 rounded-full font-bold">Unpaid</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}