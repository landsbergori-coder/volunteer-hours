import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gradeLabel, semesterLabel } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { Role, Prisma } from "@prisma/client";

/**
 * ייצוא רפלקציות והערכות אחראי לאקסל.
 * scope=student&value=<studentId> | scope=class&value=<className> |
 * scope=grade&value=GRADE_10|GRADE_11 | scope=all
 * הרשאות: מנהל — הכל; מחנך — רק תלמידי כיתתו (student/class בלבד).
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const scope = req.nextUrl.searchParams.get("scope") ?? "all";
  const value = req.nextUrl.searchParams.get("value") ?? "";

  // קביעת תנאי הסינון + בדיקת הרשאה
  let where: Prisma.StudentWhereInput;
  let label = "reflections";

  if (session.role === Role.TEACHER) {
    const teacher = await prisma.teacher.findUnique({
      where: { user_id: session.userId },
    });
    if (!teacher) return new NextResponse("Unauthorized", { status: 401 });

    if (scope === "student") {
      where = { id: Number(value), homeroom_teacher_id: teacher.id };
    } else {
      // ברירת מחדל למחנך: כל תלמידי הכיתה שלו
      where = { homeroom_teacher_id: teacher.id };
    }
    label = teacher.class_name;
  } else if (session.role === Role.ADMIN) {
    if (scope === "student") where = { id: Number(value) };
    else if (scope === "class") where = { class_name: value };
    else if (scope === "grade")
      where = { grade_level: value as "GRADE_10" | "GRADE_11" };
    else where = {}; // all
    label =
      scope === "grade" ? gradeLabel[value] ?? value : value || "all";
  } else {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const students = await prisma.student.findMany({
    where,
    include: {
      homeroom_teacher: { select: { full_name: true } },
      reflections: true,
      evaluations: {
        include: {
          volunteer_place: { select: { place_name: true } },
          supervisor: { select: { full_name: true } },
        },
        orderBy: { evaluation_date: "desc" },
      },
    },
    orderBy: [{ class_name: "asc" }, { last_name: "asc" }],
  });

  const rows = students.map((s) => {
    const reflA = s.reflections.find((r) => r.semester === "A");
    const reflB = s.reflections.find((r) => r.semester === "B");
    const evals = s.evaluations
      .map(
        (e) =>
          `• ${e.volunteer_place.place_name} (${formatDate(
            e.evaluation_date
          )}, ${e.supervisor.full_name}): ${e.evaluation_text}`
      )
      .join("\n");
    return {
      "שם פרטי": s.first_name,
      "שם משפחה": s.last_name,
      שכבה: gradeLabel[s.grade_level],
      כיתה: s.class_name,
      "מחנך/ת": s.homeroom_teacher?.full_name ?? "",
      [`רפלקציה ${semesterLabel.A}`]: reflA?.content ?? "",
      [`רפלקציה ${semesterLabel.B}`]: reflB?.content ?? "",
      "הערכות אחראי": evals,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  // רוחב עמודות נוח לקריאת טקסט ארוך
  worksheet["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 10 },
    { wch: 16 },
    { wch: 50 },
    { wch: 50 },
    { wch: 60 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "רפלקציות והערכות");

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const filename = `reflections-${label}.xlsx`.replace(/[^\w.\-]/g, "_");
  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
