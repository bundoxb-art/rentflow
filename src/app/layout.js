import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "RentFlow — Collect Rent. Stop Chasing.",
  description: "RentFlow helps landlords track who has paid, send automatic reminders, and collect rent via M-Pesa.",
  keywords: "rent collection, landlord, Kenya, M-Pesa, rental management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RentFlow",
  },
  openGraph: {
    title: "RentFlow — Collect Rent. Stop Chasing.",
    description: "The easiest way to collect rent in Kenya",
    url: "https://rentflow-lovat-omega.vercel.app",
    siteName: "RentFlow",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="RentFlow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RentFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#f0b429" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geist.className} antialiased`} suppressHydrationWarning>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('RentFlow PWA: Service Worker registered');
                  })
                  .catch(function(err) {
                    console.log('RentFlow PWA: Service Worker failed', err);
                  });
              });
            }
          `
        }} />
      </body>
    </html>
  );
}