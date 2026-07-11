"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function Reports() {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("summary");
  const [toast, setToast] = useState("");
  const [newExpense, setNewExpense] = useState({ category: "maintenance", description: "", amount: "" });
  const [landlordId, setLandlordId] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const fmt = (n) => "KSh " + (n || 0).toLocaleString();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLandlordId(user.id);

    const [{ data: pays }, { data: exps }] = await Promise.all([
      supabase.from('payments').select('*').eq('landlord_id', user.id).order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').eq('landlord_id', user.id).order('date', { ascending: false }),
    ]);

    setPayments(pays || []);
    setExpenses(exps || []);
    setLoading(false);
  };

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) { showToast("Fill in all fields"); return; }
    await supabase.from('expenses').insert({
      landlord_id: landlordId,
      category: newExpense.category,
      description: newExpense.description,
      amount: parseInt(newExpense.amount),
    });
    setNewExpense({ category: "maintenance", description: "", amount: "" });
    showToast("✅ Expense recorded!");
    fetchAll();
  };

  const exportCSV = () => {
    const rows = [
      ["Type", "Description", "Amount (KES)", "Month", "Date", "Reference"],
      ...payments.map(p => ["INCOME", `Rent — Unit`, p.amount, p.month, new Date(p.created_at).toLocaleDateString('en-KE'), p.reference]),
      ...expenses.map(e => ["EXPENSE", e.description, -e.amount, "", new Date(e.date).toLocaleDateString('en-KE'), e.category]),
    ];

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RentFlow-Income-Expense-${new Date().getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✅ CSV exported!");
  };

  const totalIncome = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="sticky top-0 bg-[#0d1117]/90 backdrop-blur border-b border-white/5 px-4 sm:px-8 py-4 flex justify-between items-center z-10">
          <h1 className="text-xl font-extrabold">Reports & Expenses 📊</h1>
          <button onClick={exportCSV}
            className="bg-green-400/10 text-green-400 border border-green-400/20 font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-400/20 transition">
            ⬇️ Export CSV
          </button>
        </div>

        <div className="px-4 sm:px-8 py-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Income", value: fmt(totalIncome), color: "#4ade80" },
              { label: "Total Expenses", value: fmt(totalExpenses), color: "#f87171" },
              { label: "Net Income", value: fmt(netIncome), color: netIncome >= 0 ? "#4ade80" : "#f87171" },
            ].map((s, i) => (
              <div key={i} className="bg-[#111827] border border-white/5 rounded-2xl p-4 text-center" style={{ borderLeft: `3px solid ${s.color}` }}>
                <div className="text-xs text-gray-500 font-bold uppercase mb-2">{s.label}</div>
                <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {["summary", "expenses", "income"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${tab === t ? "bg-[#f0b429] text-black" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "expenses" && (
            <div className="space-y-4">
              <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                <div className="font-bold mb-4">Add Expense</div>
                <div className="grid sm:grid-cols-3 gap-3 mb-3">
                  <select value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))}
                    className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429]">
                    {["maintenance", "utilities", "repairs", "cleaning", "security", "insurance", "other"].map(c => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                  <input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description"
                    className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429]" />
                  <input type="number" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                    placeholder="Amount (KES)"
                    className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429]" />
                </div>
                <button onClick={addExpense}
                  className="bg-[#f0b429] text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition">
                  + Add Expense
                </button>
              </div>

              <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-[#0d1117]/50">
                      {["Date", "Category", "Description", "Amount"].map(h => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-gray-500">No expenses recorded yet</td></tr>
                    ) : expenses.map((e, i) => (
                      <tr key={e.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                        <td className="px-5 py-4 text-xs text-gray-500">{new Date(e.date).toLocaleDateString('en-KE')}</td>
                        <td className="px-5 py-4"><span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full">{e.category}</span></td>
                        <td className="px-5 py-4 text-sm">{e.description}</td>
                        <td className="px-5 py-4 text-sm font-extrabold text-red-400">- {fmt(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "income" && (
            <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0d1117]/50">
                    {["Date", "Month", "Amount", "Method", "Reference"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-500">No income recorded yet</td></tr>
                  ) : payments.map((p, i) => (
                    <tr key={p.id} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                      <td className="px-5 py-4 text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('en-KE')}</td>
                      <td className="px-5 py-4 text-sm">{p.month}</td>
                      <td className="px-5 py-4 text-sm font-extrabold text-green-400">+ {fmt(p.amount)}</td>
                      <td className="px-5 py-4"><span className="text-xs bg-blue-400/10 text-blue-400 px-2 py-1 rounded-full uppercase">{p.method}</span></td>
                      <td className="px-5 py-4 text-xs text-gray-500 font-mono">{p.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "summary" && (
            <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
              <div className="font-bold mb-4">Monthly Breakdown</div>
              {[...Array(6)].map((_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                const monthIncome = payments.filter(p => p.month === monthName).reduce((s, p) => s + p.amount, 0);
                const monthExpenses = expenses.filter(e => {
                  const d = new Date(e.date);
                  return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                }).reduce((s, e) => s + e.amount, 0);
                const net = monthIncome - monthExpenses;
                return (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                    <div className="font-bold text-sm w-36">{monthName}</div>
                    <div className="text-xs text-green-400">+ {fmt(monthIncome)}</div>
                    <div className="text-xs text-red-400">- {fmt(monthExpenses)}</div>
                    <div className={`text-xs font-extrabold ${net >= 0 ? "text-green-400" : "text-red-400"}`}> = {fmt(net)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}
