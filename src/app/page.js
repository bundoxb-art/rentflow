"use client";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="bg-[#0d1117] text-white min-h-screen font-sans">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-4 sm:px-8 py-4 border-b border-white/10 sticky top-0 bg-[#0d1117]/90 backdrop-blur z-50">
        <div className="text-xl sm:text-2xl font-bold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>
        <div className="hidden md:flex gap-6 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how" className="hover:text-white transition">How It Works</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </div>
        <div className="hidden md:flex gap-3">
          <Link href="/auth" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">Log In</Link>
          <Link href="/auth" className="px-4 py-2 text-sm bg-[#f0b429] text-black font-bold rounded-lg hover:opacity-90 transition">Get Started Free</Link>
        </div>
        <button className="md:hidden text-gray-400 text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-[#111827] px-6 py-4 flex flex-col gap-4 text-sm text-gray-300 border-b border-white/10">
          <a href="#features" onClick={() => setMenuOpen(false)} className="hover:text-white">Features</a>
          <a href="#how" onClick={() => setMenuOpen(false)} className="hover:text-white">How It Works</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} className="hover:text-white">Pricing</a>
          <Link href="/auth" className="bg-[#f0b429] text-black font-bold px-4 py-2 rounded-lg w-fit" onClick={() => setMenuOpen(false)}>Get Started Free</Link>
        </div>
      )}

      {/* HERO */}
      <section className="text-center px-4 sm:px-6 py-16 sm:py-24 max-w-4xl mx-auto">
        <div className="inline-block bg-[#f0b429]/10 text-[#f0b429] text-xs font-bold px-4 py-2 rounded-full mb-6 border border-[#f0b429]/20">
          🇰🇪 Built for Kenyan Landlords
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          Collect Rent.<br />
          <span className="text-[#f0b429]">Stop Chasing.</span>
        </h1>
        <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10">
          RentFlow helps landlords track who has paid, send automatic reminders,
          and collect rent via M-Pesa — all from one simple dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth" className="bg-[#f0b429] text-black font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base hover:opacity-90 transition text-center">
            Start Free — No Credit Card
          </Link>
          <a href="#how" className="border border-white/20 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base hover:bg-white/5 transition text-center">
            See How It Works →
          </a>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm mt-6">Free for up to 5 units · No setup fees · Cancel anytime</p>
      </section>

      {/* PROBLEM */}
      <section className="bg-[#111827] py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Sound familiar?</h2>
          <p className="text-gray-400 text-sm sm:text-base">Every month, landlords face the same frustrating problems.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {[
            { icon: "😤", title: "Chasing Tenants", desc: "Calling and texting every tenant to find out who has paid — every single month." },
            { icon: "📒", title: "Messy Spreadsheets", desc: "Tracking rent on notebooks or Excel that get lost, corrupted, or out of date." },
            { icon: "😰", title: "Cash Flow Surprises", desc: "Not knowing your total collected until you manually add it all up at month end." },
          ].map((p, i) => (
            <div key={i} className="bg-[#0d1117] border border-red-500/20 rounded-2xl p-5 sm:p-6">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{p.icon}</div>
              <h3 className="font-bold text-base sm:text-lg mb-2 text-red-400">{p.title}</h3>
              <p className="text-gray-400 text-xs sm:text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Everything you need to manage rent</h2>
          <p className="text-gray-400 text-sm sm:text-base">RentFlow gives landlords and tenants a better experience.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {[
            { icon: "📊", color: "text-[#f0b429]", title: "Live Payment Dashboard", desc: "See instantly who has paid, who hasn't, and your total collection rate across all properties." },
            { icon: "📱", color: "text-green-400", title: "M-Pesa Integration", desc: "Tenants pay directly via M-Pesa STK Push. Payment confirms automatically — no manual updates." },
            { icon: "🔔", color: "text-blue-400", title: "Automatic Reminders", desc: "RentFlow sends SMS reminders to unpaid tenants before and after the due date — automatically." },
            { icon: "🏢", color: "text-purple-400", title: "Multi-Property Support", desc: "Manage all your properties and units from one account with per-property performance reports." },
            { icon: "🧾", color: "text-pink-400", title: "Digital Receipts", desc: "Every payment generates a professional receipt sent to the tenant automatically." },
            { icon: "👤", color: "text-orange-400", title: "Tenant Portal", desc: "Tenants log in to see their balance, due date, and payment history — no more disputes." },
          ].map((f, i) => (
            <div key={i} className="bg-[#111827] border border-white/10 rounded-2xl p-5 sm:p-6 flex gap-3 sm:gap-4 hover:border-[#f0b429]/30 transition">
              <div className={`text-2xl sm:text-3xl ${f.color} flex-shrink-0`}>{f.icon}</div>
              <div>
                <h3 className="font-bold text-sm sm:text-base mb-1">{f.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-[#111827] py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">How RentFlow Works</h2>
          <p className="text-gray-400 text-sm sm:text-base">Up and running in under 5 minutes.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 max-w-5xl mx-auto">
          {[
            { step: "1", title: "Add Your Properties", desc: "Create your properties and add your tenants with their unit and monthly rent amount." },
            { step: "2", title: "Tenants Get Notified", desc: "RentFlow automatically sends rent due reminders via SMS before the due date." },
            { step: "3", title: "Rent Paid via M-Pesa", desc: "Tenant pays via M-Pesa. Your dashboard updates instantly. Receipt sent automatically." },
            { step: "4", title: "Track Everything", desc: "See your full collection report, outstanding balances, and income summary anytime." },
          ].map((s, i) => (
            <div key={i} className="flex-1 bg-[#0d1117] border border-white/10 rounded-2xl p-5 sm:p-6 text-center">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#f0b429] text-black font-extrabold rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-base sm:text-lg">{s.step}</div>
              <h3 className="font-bold text-sm sm:text-base mb-2">{s.title}</h3>
              <p className="text-gray-400 text-xs sm:text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Simple, Honest Pricing</h2>
          <p className="text-gray-400 text-sm sm:text-base">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {[
            { name: "Free", price: "KSh 0", period: "forever", color: "border-white/10", btn: "bg-white/10 text-white", features: ["Up to 5 units", "Manual payment tracking", "Basic dashboard", "Email support"] },
            { name: "Growth", price: "KSh 1,500", period: "per month", color: "border-[#f0b429]", btn: "bg-[#f0b429] text-black", badge: "Most Popular", features: ["Up to 30 units", "M-Pesa integration", "SMS reminders (100/mo)", "Tenant portal", "PDF receipts"] },
            { name: "Pro", price: "KSh 4,000", period: "per month", color: "border-white/10", btn: "bg-white/10 text-white", features: ["Unlimited units", "Everything in Growth", "Unlimited SMS", "Monthly reports", "Priority support"] },
          ].map((p, i) => (
            <div key={i} className={`bg-[#111827] border-2 ${p.color} rounded-2xl p-6 sm:p-8 relative`}>
              {p.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f0b429] text-black text-xs font-bold px-4 py-1 rounded-full">{p.badge}</div>}
              <div className="text-gray-400 text-sm mb-2">{p.name}</div>
              <div className="text-2xl sm:text-3xl font-extrabold mb-1">{p.price}</div>
              <div className="text-gray-500 text-xs mb-5 sm:mb-6">{p.period}</div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="text-xs sm:text-sm text-gray-300 flex gap-2"><span className="text-green-400">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/auth" className={`block w-full py-3 rounded-xl font-bold text-xs sm:text-sm ${p.btn} hover:opacity-90 transition text-center`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f0b429] py-16 sm:py-20 px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black mb-4">Ready to stop chasing rent?</h2>
        <p className="text-black/70 mb-6 sm:mb-8 text-sm sm:text-lg">Join landlords already using RentFlow to collect rent on time, every month.</p>
        <Link href="/auth" className="inline-block bg-black text-white font-bold px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-sm sm:text-base hover:opacity-80 transition">
          Start Free Today →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0d1117] border-t border-white/10 px-4 sm:px-8 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xl font-bold text-[#f0b429]">Rent<span className="text-white">Flow</span></div>
          <p className="text-gray-500 text-xs sm:text-sm text-center">
            © 2026 RentFlow. Built for landlords across Kenya & East Africa. Crafted by BundoxxBriaN
          </p>
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Contact</a>
            <span className="text-gray-700">|</span>
            <Link href="/login" className="hover:text-white transition">Login</Link>
            {/* Subtle admin/developer links - low contrast */}
            <Link href="/admin/login" className="text-gray-700 hover:text-gray-500 transition text-xs">
              Admin
            </Link>
            <Link href="/developer/login" className="text-gray-700 hover:text-gray-500 transition text-xs opacity-80">
              Dev
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
