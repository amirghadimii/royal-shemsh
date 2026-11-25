import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    {
      path: "./fonts/vazirmatn-arabic-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./fonts/vazirmatn-latin-wght-normal.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "معاملات سامانه رویال شمش",
  description: "سامانه معاملات طلا و شمش رویال شمش",
  applicationName: "معاملات سامانه رویال شمش",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "رویال شمش",
  },
  icons: {
    icon: "/royal-shemsh/icons/icon.svg",
    apple: "/royal-shemsh/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#D4AF37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-dvh bg-bg-primary text-text-primary antialiased selection:bg-gold/30 selection:text-gold">
        {children}
      </body>
    </html>
  );
}
