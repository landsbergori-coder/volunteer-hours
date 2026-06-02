import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { prisma } from "@/lib/db";
import { RegisterForm } from "./RegisterForm";

// הרשימת מחנכים נטענת בזמן ריצה (לא בזמן build) כדי שמחנכים חדשים יופיעו מיד
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { full_name: "asc" },
    select: { id: true, full_name: true, class_name: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <HeartHandshake size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">הרשמת תלמיד/ה</h1>
          <p className="text-sm text-gray-500">מילוי פרטים ופתיחת חשבון</p>
        </div>

        <div className="card">
          <RegisterForm teachers={teachers} />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          כבר רשום/ה?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            התחברות
          </Link>
        </p>
      </div>
    </div>
  );
}
