import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth";
import { getPlacesSummary } from "@/lib/queries";
import { Role } from "@prisma/client";

/** ייצוא רשימת כל מקומות ההתנדבות לאקסל (מנהל בלבד). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const places = await getPlacesSummary();

  const rows = places.map((p) => ({
    "שם המקום": p.place_name,
    "אחראי": p.supervisor_name,
    "טלפון": p.supervisor_phone,
    "אימייל": p.supervisor_email,
    "חשבון אחראי במערכת": p.hasSupervisorAccount ? "כן" : "לא",
    "תלמידים פעילים": p.activeStudents.length,
    "שמות התלמידים הפעילים": p.activeStudents
      .map((s) => `${s.name} (${s.class_name})`)
      .join(", "),
    'סה"כ תלמידים שהתנדבו': p.totalStudents,
    'סה"כ שעות': p.totalHours,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 26 }, { wch: 18 }, { wch: 14 }, { wch: 26 }, { wch: 12 },
    { wch: 10 }, { wch: 60 }, { wch: 12 }, { wch: 10 },
  ];
  const workbook = XLSX.utils.book_new();
  // גיליון מימין לשמאל, כמו בשאר הממשק
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, worksheet, "מקומות התנדבות");

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="volunteer-places.xlsx"`,
    },
  });
}
