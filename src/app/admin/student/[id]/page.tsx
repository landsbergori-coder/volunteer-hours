import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getStudentProfile, listClasses } from "@/lib/queries";
import { StudentCard } from "@/components/StudentCard";
import { DeleteStudentButton } from "./DeleteStudentButton";
import { EditStudentForm } from "./EditStudentForm";
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

  const classes = await listClasses();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowRight size={16} /> חזרה לסקירה הכללית
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/reflections?scope=student&value=${profile.id}`}
            className="btn-secondary"
          >
            <FileSpreadsheet size={16} /> ייצוא רפלקציות והערכות
          </a>
          <DeleteStudentButton
            studentId={profile.id}
            name={`${profile.first_name} ${profile.last_name}`}
          />
        </div>
      </div>
      <EditStudentForm
        student={{
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          national_id: profile.national_id,
          grade_level: profile.grade_level,
          homeroom_teacher_id: profile.homeroom_teacher_id,
          email: profile.user.email,
        }}
        classes={classes}
      />

      <StudentCard profile={profile} />
    </div>
  );
}
