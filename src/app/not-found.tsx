import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 text-center">
      <div className="text-6xl font-bold text-brand-600">404</div>
      <h1 className="mt-2 text-xl font-bold text-gray-900">הדף לא נמצא</h1>
      <p className="mt-1 text-sm text-gray-500">
        ייתכן שהקישור שגוי או שהדף הוסר.
      </p>
      <Link href="/" className="btn-primary mt-6">
        <Home size={18} /> חזרה לדף הבית
      </Link>
    </div>
  );
}
