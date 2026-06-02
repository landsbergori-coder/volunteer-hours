import { redirect } from "next/navigation";
import { KeyRound, LogOut } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const forced = Boolean(session.mustChangePassword);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <KeyRound size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">החלפת סיסמה</h1>
          <p className="text-sm text-gray-500">שלום, {session.name}</p>
        </div>

        <div className="card">
          {forced && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              זוהי הכניסה הראשונה שלך. מטעמי אבטחה יש להחליף את הסיסמה הזמנית
              לפני שתמשיך/י לשימוש במערכת.
            </div>
          )}
          <ChangePasswordForm />
        </div>

        <form action="/api/logout" method="post" className="mt-4 text-center">
          <button
            type="submit"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
          >
            <LogOut size={14} /> התנתקות
          </button>
        </form>
      </div>
    </div>
  );
}
