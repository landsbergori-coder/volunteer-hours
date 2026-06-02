import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStudentProfile } from "@/lib/queries";
import { StudentCard } from "@/components/StudentCard";
import { Role } from "@prisma/client";

export default async function TeacherStudentCard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole(Role.TEACHER);
  const { id } = await params;
  const studentId = Number(id);

  const teacher = await prisma.teacher.findUnique({
    where: { user_id: session.userId },
  });
  if (!teacher) notFound();

  const profile = await getStudentProfile(studentId);
  // הרשאה: המחנך רואה רק תלמידים בכיתה שלו
  if (!profile || profile.homeroom_teacher_id !== teacher.id) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/teacher"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowRight size={16} /> חזרה לרשימת הכיתה
      </Link>
      <StudentCard profile={profile} />
    </div>
  );
}
