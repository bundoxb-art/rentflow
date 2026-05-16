import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap", // faster font loading
});

export const metadata = {
  title: "RentFlow — Collect Rent. Stop Chasing.",
  description: "RentFlow helps landlords track who has paid, send automatic reminders, and collect rent via M-Pesa.",
  keywords: "rent collection, landlord, Kenya, M-Pesa, rental management",
  openGraph: {
    title: "RentFlow — Collect Rent. Stop Chasing.",
    description: "The easiest way to collect rent in Kenya",
    url: "https://rentflow-lovat-omega.vercel.app",
    siteName: "RentFlow",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geist.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
