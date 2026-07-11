"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function MaintenanceForm({ tenant, user, showToast }) {
  const [form, setForm] = useState({ title: "", category: "plumbing", description: "", priority: "normal" });
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (tenant?.id) {
      supabase.from('maintenance_requests').select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setRequests(data || []));
    }
  }, [tenant]);

  const submit = async () => {
    if (!form.title) { showToast("Enter a title for your request"); return; }
    setSubmitting(true);

    await supabase.from('maintenance_requests').insert({
      tenant_id: tenant?.id,
      landlord_id: tenant?.landlord_id,
      apartment_id: tenant?.apartment_id,
      unit: tenant?.unit,
      tenant_name: user?.user_metadata?.full_name,
      category: form.category,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: 'open',
    });

    showToast("✅ Maintenance request submitted!");
    setForm({ title: "", category: "plumbing", description: "", priority: "normal" });
    setShowForm(false);
    setSubmitting(false);

    // Refresh
    const { data } = await supabase.from('maintenance_requests')
      .select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const statusColors = {
    open: "bg-yellow-400/10 text-yellow-400",
    in_progress: "bg-blue-400/10 text-blue-400",
    resolved: "bg-green-400/10 text-green-400",
  };

  return (
    <div className="space-y-3">
      {/* Submit Button */}
      <button onClick={() => setShowForm(!showForm)}
        className="w-full bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-[#f0b429]/40 transition">
        <div className="text-2xl w-12 h-12 rounded-xl bg-[#f0b429]/10 flex items-center justify-center flex-shrink-0">🔧</div>
        <div>
          <div className="font-bold text-sm text-[#f0b429]">Report Maintenance Issue</div>
          <div className="text-xs text-gray-500 mt-0.5">Plumbing, electricity, repairs and more</div>
        </div>
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition">
              {[
                "plumbing", "electrical", "structural", "pest_control",
                "cleaning", "security", "internet", "other"
              ].map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Leaking tap in bathroom"
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition" />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "low", label: "Low", color: "text-green-400 border-green-400/20" },
                { key: "normal", label: "Normal", color: "text-[#f0b429] border-[#f0b429]/20" },
                { key: "urgent", label: "Urgent 🚨", color: "text-red-400 border-red-400/20" },
              ].map(p => (
                <button key={p.key} onClick={() => setForm(f => ({ ...f, priority: p.key }))}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${form.priority === p.key ? p.color + ' bg-white/5' : 'border-white/10 text-gray-500'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={submit} disabled={submitting}
              className="flex-1 bg-[#f0b429] text-black font-extrabold py-3 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70">
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-white/5 text-gray-400 font-bold py-3 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing Requests */}
      {requests.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">My Requests</div>
          {requests.map(r => (
            <div key={r.id} className="bg-[#111827] border border-white/5 rounded-2xl p-4 mb-2">
              <div className="flex justify-between items-start mb-1">
                <div className="font-bold text-sm">{r.title}</div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[r.status] || statusColors.open}`}>
                  ● {r.status?.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-gray-500">{r.category?.replace('_', ' ')} · {new Date(r.created_at).toLocaleDateString('en-KE')}</div>
              {r.notes && <div className="text-xs text-blue-400 mt-2 bg-blue-400/10 rounded-lg p-2">{r.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}