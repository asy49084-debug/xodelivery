import "./globals.css";
import type { Metadata, Viewport } from "next";
import SwRegister from "./SwRegister";
export const metadata: Metadata = {
  title: "XO Delivery", manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "XO Delivery", statusBarStyle: "default" },
  icons: { apple: "/icon-192.png" },
};
export const viewport: Viewport = { themeColor: "#ff6a00", viewportFit: "cover", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="ar" dir="rtl"><body>{children}<SwRegister /></body></html>);
}
