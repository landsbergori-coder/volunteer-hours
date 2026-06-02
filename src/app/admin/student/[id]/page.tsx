import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentProfile } from "@/lib/queries";
import { StudentCard } from "@/components/StudentCard";
import { Role } from "@prisma/client";

export default async function AdminStudentCard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(Role.ADMIN);
  const { id } = await params;
  const profile = await getStudentProfile(Number(id));
  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowRight size={16} /> חזרה לסקירה הכללית
      </Link>
      <StudentCard profile={profile} />
    </div>
  );
}
