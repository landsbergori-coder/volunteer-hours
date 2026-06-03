import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <HeartHandshake size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">מעורבות חברתית</h1>
          <p className="text-sm text-gray-500">
            מערכת לניהול ורישום שעות התנדבות
          </p>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-bold">התחברות</h2>
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          תלמיד/ה חדש/ה?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">
            הרשמה למערכת
          </Link>
        </p>
      </div>
    </div>
  );
}
