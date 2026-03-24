import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "OneMinuteCloser Jobs",
  description:
    "Serious weekly job intelligence for ambitious students: companies, referrals, outreach, and resume guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-surface text-foreground">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-surface text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
