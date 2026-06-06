import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { prisma } from "@/lib/db";
import { SCHOOL_NAME } from "@/lib/validation";
import { RegisterForm } from "./RegisterForm";

// הרשימת מחנכים נטענת בזמן ריצה (לא בזמן build) כדי שמחנכים חדשים יופיעו מיד
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const teachers = await prisma.teacher.findMany({
    where: { user: { archived_at: null } },
    orderBy: { full_name: "asc" },
    select: { id: true, full_name: true, class_name: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-4 py-8">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-lg border border-gray-100 flex flex-col sm:flex-row">

        {/* פאנל מותגי */}
        <div className="flex flex-col items-center justify-center gap-5 bg-brand-800 px-10 py-12 text-center sm:w-[38%] sm:shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <HeartHandshake size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-snug">מעורבות חברתית</h1>
            <p className="mt-1.5 text-sm font-medium text-white/90">{SCHOOL_NAME}</p>
            <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
              פתיחת חשבון תלמיד/ה<br />חדש/ה במערכת
            </p>
          </div>
          <div className="mt-2 rounded-xl bg-white/10 px-4 py-3 text-xs text-white/70 leading-relaxed text-right">
            לאחר ההרשמה תוכל/י<br />לדווח שעות התנדבות<br />ולעקוב אחר ההתקדמות
          </div>
        </div>

        {/* טופס הרשמה */}
        <div className="flex flex-1 flex-col justify-center bg-white px-8 py-10">
          <h2 className="mb-6 text-xl font-bold text-gray-900">הרשמת תלמיד/ה</h2>
          <RegisterForm teachers={teachers} />
          <p className="mt-5 text-center text-sm text-gray-500">
            כבר רשום/ה?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:underline">
              התחברות
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
