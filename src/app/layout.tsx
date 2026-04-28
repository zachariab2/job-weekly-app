import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "JobWeekly",
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
        className={`${plusJakarta.variable} ${dmMono.variable} antialiased min-h-screen bg-surface text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
