"use client";
import { useState, useEffect } from "react";

export default function MaintenanceView({ tenantId, supabase, showToast }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (tenantId && supabase) {
      supabase.from('maintenance_requests').select('*')
        .eq('tenant_id', tenantId).order('created_at', { ascending: false })
        .then(({ data }) => setRequests(data || []));
    }
  }, [tenantId, supabase]);

  const updateStatus = async (id, status, notes) => {
    await supabase.from('maintenance_requests').update({
      status, notes, resolved_at: status === 'resolved' ? new Date().toISOString() : null
    }).eq('id', id);
    setRequests(r => r.map(x => x.id === id ? { ...x, status, notes } : x));
    showToast(`Request marked as ${status}`);
  };

  if (requests.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">🔧 Maintenance Requests</div>
      {requests.map(r => (
        <div key={r.id} className="bg-[#0d1117] rounded-xl p-3 mb-2">
          <div className="flex justify-between mb-1">
            <div className="font-bold text-xs">{r.title}</div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              r.status === 'resolved' ? 'bg-green-400/10 text-green-400' :
              r.status === 'in_progress' ? 'bg-blue-400/10 text-blue-400' :
              'bg-yellow-400/10 text-yellow-400'
            }`}>{r.status}</span>
          </div>
          <div className="text-xs text-gray-500 mb-2">{r.category} · {r.priority} priority</div>
          <div className="flex gap-2">
            {r.status !== 'in_progress' && r.status !== 'resolved' && (
              <button onClick={() => updateStatus(r.id, 'in_progress', 'Being attended to')}
                className="text-xs px-2 py-1 rounded-lg bg-blue-400/10 text-blue-400 font-bold">
                In Progress
              </button>
            )}
            {r.status !== 'resolved' && (
              <button onClick={() => updateStatus(r.id, 'resolved', 'Issue resolved')}
                className="text-xs px-2 py-1 rounded-lg bg-green-400/10 text-green-400 font-bold">
                ✅ Resolve
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
