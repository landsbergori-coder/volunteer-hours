import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gradeLabel } from "@/lib/validation";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  // הרשאה: מנהל בלבד
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";

  const students = await prisma.student.findMany({
    where: { user: { archived_at: null } },
    include: {
      homeroom_teacher: { select: { full_name: true } },
      hours: { select: { calculated_hours: true } },
      reflections: { select: { semester: true } },
      evaluations: { select: { id: true } },
      placements: {
        where: { is_active: true },
        include: { volunteer_place: { select: { place_name: true, supervisor_name: true } } },
      },
    },
    orderBy: [{ class_name: "asc" }, { last_name: "asc" }],
  });

  const data = students.map((s) => {
    const total = s.hours.reduce((sum, h) => sum + h.calculated_hours, 0);
    const sem = new Set(s.reflections.map((r) => r.semester));
    const places = s.placements.map((pl) => pl.volunteer_place);
    return {
      "שם פרטי": s.first_name,
      "שם משפחה": s.last_name,
      'ת"ז': s.national_id,
      שכבה: gradeLabel[s.grade_level],
      כיתה: s.class_name,
      "מחנך/ת": s.homeroom_teacher?.full_name ?? "",
      "מקום התנדבות": places.map((p) => p.place_name).join(", "),
      "אחראי במקום": places.map((p) => p.supervisor_name).join(", "),
      "מספר מקומות": places.length,
      'סה"כ שעות': Math.round(total * 100) / 100,
      "רפלקציה א'": sem.has("A") ? "הוגשה" : "חסר",
      "רפלקציה ב'": sem.has("B") ? "הוגשה" : "חסר",
      "הערכת אחראי": s.evaluations.length > 0 ? "יש" : "אין",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "תלמידים");

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    // BOM כדי שעברית תוצג נכון ב-Excel
    const body = "﻿" + csv;
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="students.csv"`,
      },
    });
  }

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="students.xlsx"`,
    },
  });
}
