import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mileage Tracker",
  description: "Multi-user vehicle fleet mileage tracker",
  applicationName: "Mileage Tracker",
  appleWebApp: {
    capable: true,
    title: "Mileage",
    statusBarStyle: "default",
  },
  formatDetection: {
    // Odometer readings and plates shouldn't turn into tappable phone links.
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  // Matches the white app header so the status bar / PWA title bar blends in.
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  // Let the app draw under the notch / home indicator; layout pads with
  // env(safe-area-inset-*) where needed. Pinch-zoom stays enabled.
  viewportFit: "cover",
  // Keep the on-screen keyboard from covering focused inputs on Android.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-zinc-50 text-zinc-900">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
