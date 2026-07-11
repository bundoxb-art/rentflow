import Link from "next/link";

export const metadata = {
  title: "Terms of Service — RentFlow",
};

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">
      <nav className="bg-[#111827] border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-extrabold text-[#f0b429]">
          Rent<span className="text-white">Flow</span>
        </Link>
        <Link href="/auth" className="text-sm text-gray-400 hover:text-white transition">Login →</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">
          Last updated: {new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {[
          {
            title: "1. Acceptance of Terms",
            content: `By creating an account on RentFlow, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.

RentFlow is operated by BundoxxBrian, Mombasa, Kenya.`
          },
          {
            title: "2. Description of Service",
            content: `RentFlow provides:
- Property and tenant management tools
- Rent tracking and payment recording
- Digital receipt generation
- Financial reporting for landlords and property managers

M-Pesa payment integration is currently in active development and subject to Safaricom Daraja API approval. Some payment features may be limited during this period.`
          },
          {
            title: "3. Account Responsibilities",
            content: `You are responsible for:
- Keeping your login credentials confidential
- All activity that occurs under your account
- Ensuring the accuracy of tenant and payment data you enter
- Complying with all applicable Kenyan laws including the Data Protection Act (2019)

You must not share your account with others or use the platform for fraudulent purposes.`
          },
          {
            title: "4. Payment and Billing",
            content: `RentFlow subscription fees are payable monthly or annually as agreed. Fees are non-refundable except where required by law.

We reserve the right to suspend accounts with overdue payments after 7 days' notice.

Current pricing is available on our pricing page and may be updated with 30 days' notice.`
          },
          {
            title: "5. M-Pesa Integration",
            content: `RentFlow integrates with Safaricom's Daraja API for M-Pesa payments. By using payment features, you agree to Safaricom's terms of service.

RentFlow is not responsible for failed M-Pesa transactions caused by network issues, incorrect phone numbers, or Safaricom system downtime.`
          },
          {
            title: "6. Data and Privacy",
            content: `Your use of RentFlow is also governed by our Privacy Policy. You retain ownership of all data you enter into the platform. We do not claim ownership of your tenant or payment data.`
          },
          {
            title: "7. Limitation of Liability",
            content: `RentFlow is provided "as is". We do not guarantee 100% uptime or error-free operation. To the maximum extent permitted by law, BundoxxBrian shall not be liable for:
- Loss of data
- Lost revenue or profits
- Indirect or consequential damages

Our total liability shall not exceed the amount you paid in the past 3 months.`
          },
          {
            title: "8. Termination",
            content: `You may cancel your account at any time by contacting us. We may terminate accounts that violate these terms, with or without notice.

On termination, you may request an export of your data within 30 days.`
          },
          {
            title: "9. Governing Law",
            content: `These terms are governed by the laws of Kenya. Any disputes shall be resolved in the courts of Mombasa County, Kenya.`
          },
          {
            title: "10. Contact",
            content: `Questions about these terms?

Email: bundoxb@gmail.com
WhatsApp: +254 759 435 210
Location: Mombasa, Kenya`
          },
        ].map((section, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-lg font-extrabold mb-3 text-[#f0b429]">{section.title}</h2>
            <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line bg-[#111827] rounded-2xl p-5 border border-white/5">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}