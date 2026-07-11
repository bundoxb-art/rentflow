import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#f0b429] hover:text-yellow-300 transition">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold mt-6 mb-4">Contact Us</h1>
        <p className="text-gray-400 leading-7">
          Need help with RentFlow? We are available by email or WhatsApp.
        </p>
        <div className="mt-6 space-y-3 text-gray-300">
          <p>Email: <a href="mailto:bundoxb@gmail.com" className="text-[#f0b429]">bundoxb@gmail.com</a></p>
          <p>WhatsApp: <a href="https://wa.me/254759435210" target="_blank" rel="noreferrer" className="text-[#f0b429]">+254 759 435210</a></p>
        </div>
      </div>
    </main>
  );
}
