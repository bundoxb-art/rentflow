"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function TenantSignup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", unit: "", apartment_id: "", message: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apartments, setApartments] = useState([]);

  useEffect(() => {
    supabase.from('apartments').select('*').eq('status', 'active')
      .then(({ data }) => setApartments(data || []));
  }, []);

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const signup = async () => {
    setLoading(true);
    setError("");

    if (!form.name) { setError("Please enter your full name"); setLoading(false); return; }
    if (!form.email) { setError("Please enter your email"); setLoading(false); return; }
    if (!form.apartment_id) { setError("Please select your apartment"); setLoading(false); return; }
    if (!form.unit) { setError("Please enter your unit number"); setLoading(false); return; }
    if (!form.password || form.password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match"); setLoading(false); return; }

    // Create auth account
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, role: 'tenant' } }
    });

    if (authError) { setError(authError.message); setLoading(false); return; }

    if (data.user) {
      // Find the landlord assigned to this apartment
      const { data: landlordMatch } = await supabase
        .from('landlord_profiles')
        .select('id, full_name')
        .eq('apartment_id', form.apartment_id)
        .eq('status', 'approved')
        .single();

      if (!landlordMatch) {
        setError("This apartment doesn't have an active landlord yet. Please choose another apartment or contact support.");
        setLoading(false);
        return;
      }

      const selectedApt = apartments.find(a => a.id === form.apartment_id);

      // Save tenant profile with apartment + landlord link
      await supabase.from('tenant_profiles').upsert({
        id: data.user.id,
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        unit: form.unit,
        apartment_id: form.apartment_id,
        landlord_id: landlordMatch.id,
        status: 'pending',
      });

      // Create the tenant request
      const { data: reqData } = await supabase.from("tenant_requests").insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        unit: form.unit,
        property_name: selectedApt?.name,
        apartment_id: form.apartment_id,
        landlord_id: landlordMatch.id,
        message: form.message,
        status: "pending",
        user_id: data.user.id
      }).select().single();

      // Notify the matched landlord
      await supabase.from('landlord_notifications').insert({
        landlord_id: landlordMatch.id,
        tenant_request_id: reqData?.id,
        tenant_name: form.name,
        unit: form.unit,
        message: `${form.name} applied for Unit ${form.unit} and needs your approval.`,
      });
    }

    window.location.href = '/tenant-pending';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#f0b429]">
            RentFlow <span className="text-white">Pro</span>
          </div>
          <div className="inline-block bg-[#f0b429]/10 border border-[#f0b429]/20 text-[#f0b429] text-xs font-bold px-4 py-1.5 rounded-full mt-2">
            🏠 TENANT PORTAL
          </div>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-extrabold mb-1 text-center">Apply for Apartment</h1>
          <p className="text-gray-500 text-xs text-center mb-6">
            Already have an account?{" "}
            <Link href="/tenant/login" className="text-[#f0b429] font-bold hover:underline">Login here</Link>
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Full Name *</label>
              <input name="name" value={form.name} onChange={handle} placeholder="e.g. Jane Mwangi"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="jane@email.com"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Phone Number</label>
              <div className="flex gap-2">
                <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-gray-400 text-sm flex items-center flex-shrink-0">🇰🇪 +254</div>
                <input name="phone" value={form.phone} onChange={handle} placeholder="712 345 678"
                  className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                Apartment <span className="text-red-400">*</span>
              </label>
              <select name="apartment_id" value={form.apartment_id || ""} onChange={handle}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#f0b429] transition">
                <option value="">Select your apartment...</option>
                {apartments.map(apt => (
                  <option key={apt.id} value={apt.id}>{apt.name} — {apt.city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Unit Number *</label>
              <input name="unit" value={form.unit} onChange={handle} placeholder="e.g. 301"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Message (Optional)</label>
              <textarea name="message" value={form.message} onChange={handle} placeholder="Tell us about yourself..."
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition h-20 resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Password *</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="Min 8 characters"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Confirm Password *</label>
              <input name="confirm" type="password" value={form.confirm} onChange={handle} placeholder="Repeat password"
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#f0b429] transition" />
            </div>

            {error && <div className="bg-red-400/10 text-red-400 border border-red-400/20 rounded-xl p-3 text-sm font-bold">{error}</div>}

            <button onClick={signup} disabled={loading}
              className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70">
              {loading ? "Submitting Application..." : "Submit Application →"}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">
          🔒 Your information is secure and will only be shared with the property landlord
        </p>
      </div>
    </div>
  );
}
