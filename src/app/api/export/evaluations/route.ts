import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STANDARD_HOURS } from "@/lib/validation";
import { hoursInGrade, certificateEvaluation } from "@/lib/progress";
import { Role } from "@prisma/client";

/**
 * ייצוא הערכה מילולית לתעודת מחצית (מחנך בלבד).
 * כולל את תלמידי הכיתה בשכבות י'/י"א (לי"ב אין דרישת שעות שנתית — מוחרגים).
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== Role.TEACHER) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { user_id: session.userId },
  });
  if (!teacher) return new NextResponse("Unauthorized", { status: 401 });

  const students = await prisma.student.findMany({
    where: {
      homeroom_teacher_id: teacher.id,
      user: { archived_at: null },
      grade_level: { in: ["GRADE_10", "GRADE_11"] },
    },
    include: { hours: { select: { calculated_hours: true, grade_level: true } } },
    orderBy: { last_name: "asc" },
  });

  const rows = students.map((s) => {
    const done = hoursInGrade(s.hours, s.grade_level, s.grade_level);
    const target = STANDARD_HOURS[s.grade_level] ?? 0;
    return {
      "שם התלמיד": `${s.first_name} ${s.last_name}`,
      "הערכה מילולית": certificateEvaluation(done, target),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [{ wch: 22 }, { wch: 90 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "הערכות לתעודה");

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const filename = `evaluations-${teacher.class_name}.xlsx`.replace(
    /[^\w.\-]/g,
    "_"
  );
  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
