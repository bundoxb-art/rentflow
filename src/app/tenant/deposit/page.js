"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TenantDeposit() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [depositAmount, setDepositAmount] = useState(5000);
  const [user, setUser] = useState(null);
  const [depositPaid, setDepositPaid] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/tenant/login'; return; }

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setPhone(user.user_metadata?.phone || "");

      // Check if deposit already paid
      const { data: deposit } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .single();

      if (deposit) {
        window.location.href = '/tenant';
        return;
      }

      // Get deposit amount from settings
      const { data: setting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'deposit_amount')
        .single();

      if (setting) setDepositAmount(parseInt(setting.value));
    };
    init();
  }, []);

  const payDeposit = async () => {
    if (!phone) { showToast("Enter your M-Pesa number"); return; }
    setPayLoading(true);

    let formattedPhone = phone.replace(/\s/g, '').replace('+', '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);

    try {
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          amount: depositAmount,
          tenantId: user?.id,
          tenantName: user?.user_metadata?.full_name || 'Tenant',
          isDeposit: true,
        })
      });

      const data = await res.json();

      if (data.success) {
        setStep(2);
        showToast("📱 M-Pesa prompt sent!");
      } else {
        showToast("❌ " + data.message);
      }
    } catch (err) {
      showToast("❌ Error: " + err.message);
    }
    setPayLoading(false);
  };

  const confirmDeposit = async () => {
    setLoading(true);

    // Record deposit as pending (will be confirmed by M-Pesa callback)
    await supabase.from('deposits').insert({
      user_id: user.id,
      amount: depositAmount,
      status: 'pending',
      mpesa_reference: 'PENDING_' + Date.now(),
    });

    showToast("✅ Payment submitted! Awaiting confirmation...");
    setDepositPaid(true);
    setLoading(false);

    // Check after 5 seconds
    setTimeout(async () => {
      const { data: deposit } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (deposit?.status === 'confirmed') {
        window.location.href = '/tenant';
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-3xl font-extrabold text-[#f0b429]">
            Rent<span className="text-white">Flow</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Activate Your Account</p>
        </div>

        <div className="bg-[#111827] border border-[#f0b429]/20 rounded-2xl p-8">

          {!depositPaid ? (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🏠</div>
                <h1 className="text-xl font-extrabold mb-2">Pay Activation Deposit</h1>
                <p className="text-gray-400 text-sm">
                  A one-time deposit is required to activate your tenant account.
                </p>
              </div>

              <div className="bg-[#0d1117] rounded-2xl p-5 mb-6 text-center">
                <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Deposit Amount</div>
                <div className="text-4xl font-extrabold text-[#f0b429]">
                  KSh {depositAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  One-time payment · Refundable on exit
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {[
                  "✅ Activates your tenant account",
                  "✅ Gives you access to pay rent online",
                  "✅ Download payment receipts",
                  "✅ Refundable when you leave",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">{item}</div>
                ))}
              </div>

              {step === 1 && (
                <>
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">
                      M-Pesa Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-gray-400 text-sm flex items-center">
                        🇰🇪 +254
                      </div>
                      <input
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="712 345 678"
                        className="flex-1 bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#f0b429] transition"
                      />
                    </div>
                  </div>

                  <button onClick={payDeposit} disabled={payLoading}
                    className="w-full bg-[#f0b429] text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition disabled:opacity-70 flex items-center justify-center gap-2">
                    {payLoading ? (
                      <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sending...</>
                    ) : "📱 Pay Deposit via M-Pesa →"}
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3 animate-bounce">📲</div>
                    <div className="font-bold">Check your phone!</div>
                    <div className="text-gray-400 text-sm">Enter M-Pesa PIN to pay KSh {depositAmount.toLocaleString()}</div>
                  </div>

                  <button onClick={confirmDeposit} disabled={loading}
                    className="w-full bg-green-400 text-black font-extrabold py-4 rounded-xl text-sm hover:opacity-90 transition mb-3">
                    {loading ? "Processing..." : "✓ I've Paid the Deposit"}
                  </button>

                  <button onClick={() => setStep(1)}
                    className="w-full bg-white/5 text-gray-400 font-bold py-3 rounded-xl text-sm hover:bg-white/10 transition">
                    ← Try Again
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-4">⏳</div>
              <h1 className="text-xl font-extrabold mb-2">Processing Payment...</h1>
              <p className="text-gray-400 text-sm mb-4">
                Confirming your deposit payment. This may take a moment.
              </p>
              <div className="animate-pulse flex justify-center gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-[#f0b429] rounded-full"
                    style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          Need help? Contact your landlord or admin
        </p>
      </div>

      <div className={`fixed bottom-6 right-6 bg-[#f0b429] text-black font-extrabold px-5 py-3 rounded-xl text-sm z-[100] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        {toast}
      </div>
    </div>
  );
}