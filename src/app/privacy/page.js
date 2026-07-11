"use client";
import { useState } from "react";
import Link from "next/link";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    // In production, wire this to an email API like Resend
    // For now, open mailto as fallback
    const subject = encodeURIComponent(form.subject || "RentFlow Enquiry");
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.open(`mailto:bundoxb@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">
      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-extrabold text-[#f0b429]">
          Rent<span className="text-white">Flow</span>
        </Link>
        <Link href="/auth" className="text-sm text-gray-400 hover:text-white transition">Login →</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold mb-3">Contact Us</h1>
          <p className="text-gray-400">We&apos;re based in Mombasa — reach us any way that works for you.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">

          {/* Contact Info */}
          <div className="space-y-4">
            {[
              {
                icon: "📧",
                label: "Email",
                value: "bundoxb@gmail.com",
                href: "mailto:bundoxb@gmail.com",
                sub: "We reply within 24 hours"
              },
              {
                icon: "💬",
                label: "WhatsApp",
                value: "+254 759 435 210",
                href: "https://wa.me/254759435210",
                sub: "Fastest way to reach us"
              },
              {
                icon: "📍",
                label: "Location",
                value: "Mombasa, Kenya",
                href: null,
                sub: "East Africa focused"
              },
            ].map((c, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-5 flex items-start gap-4">
                <div className="text-2xl">{c.icon}</div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{c.label}</div>
                  {c.href ? (
                    <a href={c.href} target="_blank" rel="noreferrer"
                      className="font-bold text-[#f0b429] hover:underline">{c.value}</a>
                  ) : (
                    <div className="font-bold">{c.value}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-0.5">{c.sub}</div>
                </div>
              </div>
            ))}

            <div className="bg-[#f0b429]/10 border border-[#f0b429]/20 rounded-2xl p-5">
              <div className="font-bold mb-2">🚀 Want a Demo?</div>
              <p className="text-gray-400 text-sm">
                We&apos;ll walk you through the full platform — from manager setup to tenant rent payment — in under 20 minutes.
              </p>
              <a href="https://wa.me/254759435210?text=Hi%2C%20I%27d%20like%20a%20RentFlow%20demo"
                target="_blank" rel="noreferrer"
                className="inline-block mt-3 bg-[#f0b429] text-black font-extrabold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
                Request Demo on WhatsApp →
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-extrabold mb-2">Message Sent!</h2>
                <p className="text-gray-400 text-sm">Your email client should have opened. We&apos;ll reply within 24 hours.</p>
                <button onClick={() => setSent(false)}
                  className="mt-4 text-[#f0b429] text-sm font-bold hover:underline">
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-extrabold text-lg mb-5">Send a Message</h2>
                <div className="space-y-4">
                  {[
                    { name: "name", label: "Your Name", placeholder: "John Mutua" },
                    { name: "email", label: "Email Address", placeholder: "john@company.com", type: "email" },
                    { name: "subject", label: "Subject", placeholder: "e.g. Pricing enquiry" },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">{f.label}</label>
                      <input name={f.name} type={f.type || "text"}
                        value={form[f.name]} onChange={handle}
                        placeholder={f.placeholder}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Message</label>
                    <textarea name="message" value={form.message} onChange={handle}
                      placeholder="Tell us how we can help..."
                      rows={4}
                      className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition resize-none" />
                  </div>
                  <button onClick={submit} disabled={loading || !form.name || !form.email || !form.message}
                    className="w-full bg-[#f0b429] text-black font-extrabold py-3.5 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50">
                    {loading ? "Sending..." : "Send Message →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}