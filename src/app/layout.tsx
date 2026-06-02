import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מחויבות אישית — ניהול שעות התנדבות",
  description: "מערכת לניהול ורישום שעות התנדבות לתלמידי שכבות י' ו-י\"א",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans antialiased text-gray-800">{children}</body>
    </html>
  );
}
