import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Checker",
  description: "Morning macro briefing dashboard for Vercel + Next.js"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
