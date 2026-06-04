import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-4 py-8">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-lg border border-gray-100 flex flex-col sm:flex-row">

        {/* פאנל מותגי — ימין (RTL: מוצג ראשון) */}
        <div className="flex flex-col items-center justify-center gap-5 bg-brand-800 px-10 py-12 text-center sm:w-[42%] sm:shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <HeartHandshake size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-snug">מעורבות חברתית</h1>
            <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
              מערכת לניהול ורישום<br />שעות התנדבות
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {["שכבה י׳", "שכבה י״א", "שכבה י״ב"].map((g) => (
              <span key={g} className="rounded-full bg-white/12 px-3 py-1 text-xs text-white/75">
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* טופס התחברות — שמאל */}
        <div className="flex flex-1 flex-col justify-center bg-white px-8 py-10">
          <h2 className="mb-6 text-xl font-bold text-gray-900">התחברות</h2>
          <LoginForm />
          <p className="mt-5 text-center text-sm text-gray-500">
            תלמיד/ה חדש/ה?{" "}
            <Link href="/register" className="font-semibold text-brand-600 hover:underline">
              הרשמה למערכת
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
