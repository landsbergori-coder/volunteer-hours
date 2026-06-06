import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { Footer } from "@/components/Footer";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מעורבות חברתית — מוסד חינוכי עמקים-תבור",
  description: "מערכת לניהול ורישום שעות התנדבות לתלמידי שכבות י' ו-י\"א",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased text-gray-800">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
