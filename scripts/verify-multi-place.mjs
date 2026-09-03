/**
 * אימות ריבוי מקומות התנדבות (נתונים זמניים — נמחקים בסוף).
 * דורש שרת רץ ב-localhost:3000.
 *   node scripts/verify-multi-place.mjs
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

// טעינת .env (הסקריפט רץ מחוץ ל-Next)
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n\r]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const p = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
let all = true;
const ok = (l, c) => { console.log(`${c ? "✅" : "❌"} ${l}`); all &&= !!c; return c; };

const TMP_EMAIL = "__multiplace_tmp__@x.il";
let userId = null;

try {
  await p.user.deleteMany({ where: { email: TMP_EMAIL } });

  // --- מקומות התנדבות זמניים ---
  const placeA = await p.volunteerPlace.create({
    data: { place_name: "__TMP מקום א__", supervisor_name: "אחראי א", supervisor_phone: "050-1111111", supervisor_email: "__tmp_a__@x.il" },
  });
  const placeB = await p.volunteerPlace.create({
    data: { place_name: "__TMP מקום ב__", supervisor_name: "אחראי ב", supervisor_phone: "050-2222222", supervisor_email: "__tmp_b__@x.il" },
  });

  const user = await p.user.create({
    data: {
      full_name: "TMP רב-מקומות", email: TMP_EMAIL, password_hash: "x", role: "STUDENT",
      student: { create: { first_name: "TMP", last_name: "רב-מקומות", national_id: "9" + Math.floor(Math.random() * 100000000), grade_level: "GRADE_10", class_name: "__mp__" } },
    },
    include: { student: true },
  });
  userId = user.id;
  const sid = user.student.id;

  // --- שני מקומות פעילים במקביל ---
  const plA = await p.studentVolunteerPlacement.create({ data: { student_id: sid, volunteer_place_id: placeA.id, is_active: true } });
  const plB = await p.studentVolunteerPlacement.create({ data: { student_id: sid, volunteer_place_id: placeB.id, is_active: true } });
  const actives = await p.studentVolunteerPlacement.count({ where: { student_id: sid, is_active: true } });
  ok(`שני מקומות פעילים במקביל (${actives})`, actives === 2);

  // --- שעות לכל מקום בנפרד ---
  const addH = (placeId, placementId, h) => p.volunteerHours.create({
    data: { student_id: sid, volunteer_place_id: placeId, placement_id: placementId, volunteer_date: new Date("2026-01-12"), start_time: "08:00", end_time: `${8 + h}:00`, calculated_hours: h, grade_level: "GRADE_10", description: "tmp" },
  });
  await addH(placeA.id, plA.id, 3);
  await addH(placeB.id, plB.id, 5);

  const hours = await p.volunteerHours.findMany({ where: { student_id: sid } });
  const perPlacement = new Map();
  for (const h of hours) perPlacement.set(h.placement_id, (perPlacement.get(h.placement_id) ?? 0) + h.calculated_hours);
  ok(`שעות מיוחסות למקום הנכון (א=${perPlacement.get(plA.id)}, ב=${perPlacement.get(plB.id)})`, perPlacement.get(plA.id) === 3 && perPlacement.get(plB.id) === 5);
  ok("סך השעות מצטבר מכל המקומות = 8", hours.reduce((s, h) => s + h.calculated_hours, 0) === 8);

  // --- רינדור המסכים ---
  const token = await new SignJWT({ userId, role: "STUDENT", name: "TMP" })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
  const get = async (path) => {
    const res = await fetch(`http://localhost:3000${path}`, { headers: { cookie: `session=${token}` }, redirect: "manual" });
    return { status: res.status, html: await res.text() };
  };

  const place = await get("/student/place");
  ok(`/student/place נטען (${place.status})`, place.status === 200);
  ok("/student/place מציג את שני המקומות הפעילים", place.html.includes("__TMP מקום א__") && place.html.includes("__TMP מקום ב__"));
  ok("/student/place מציג כפתור סיום התנדבות", place.html.includes("סיום"));

  const hoursPage = await get("/student/hours");
  ok(`/student/hours נטען (${hoursPage.status})`, hoursPage.status === 200);
  ok("/student/hours מציג בורר מקום עם שתי אפשרויות", hoursPage.html.includes(`value="${plA.id}"`) && hoursPage.html.includes(`value="${plB.id}"`));

  const dash = await get("/student");
  ok(`/student נטען (${dash.status})`, dash.status === 200);
  ok("/student מציג '2 מקומות'", dash.html.includes("2 מקומות"));

  // --- סיום מקום אחד: השני נשאר פעיל, השעות נשמרות ---
  await p.studentVolunteerPlacement.updateMany({
    where: { id: plA.id, student_id: sid, is_active: true },
    data: { is_active: false, end_date: new Date() },
  });
  const stillActive = await p.studentVolunteerPlacement.findMany({ where: { student_id: sid, is_active: true } });
  ok("אחרי סיום מקום א' — נשאר מקום פעיל אחד", stillActive.length === 1 && stillActive[0].id === plB.id);
  ok("השעות של המקום שהסתיים נשמרו", (await p.volunteerHours.count({ where: { placement_id: plA.id } })) === 1);

  const after = await get("/student/place");
  ok("/student/place מציג את מקום א' תחת 'מקומות שהסתיימו'", after.html.includes("מקומות שהסתיימו") && after.html.includes("__TMP מקום א__"));

  // --- מעבר שנה: בחירה באילו מקומות להמשיך ---
  // מחזירים את מקום א' לפעיל ומוסיפים מקום ג', כדי שיהיו שלושה פעילים
  await p.studentVolunteerPlacement.update({ where: { id: plA.id }, data: { is_active: true, end_date: null } });
  const placeC = await p.volunteerPlace.create({
    data: { place_name: "__TMP מקום ג__", supervisor_name: "אחראי ג", supervisor_phone: "050-3333333", supervisor_email: "__tmp_c__@x.il" },
  });
  const plC = await p.studentVolunteerPlacement.create({ data: { student_id: sid, volunteer_place_id: placeC.id, is_active: true } });
  await p.student.update({ where: { id: sid }, data: { needs_placement_review: true } });

  const banner = await get("/student");
  ok("מסך התלמיד מציג את באנר מעבר השנה", banner.html.includes("שנת לימודים חדשה"));
  ok("הבאנר מציג תיבת סימון לכל מקום פעיל",
    [plA, plB, plC].every((pl) => banner.html.includes(`name="keep_placement_id"`) && banner.html.includes(`value="${pl.id}"`)));

  // סימולציה של הפעולה: ממשיכים רק במקומות א' ו-ג' (ב' לא סומן)
  const keepIds = [plA.id, plC.id];
  await p.$transaction([
    p.studentVolunteerPlacement.updateMany({
      where: { student_id: sid, is_active: true, ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}) },
      data: { is_active: false, end_date: new Date() },
    }),
    p.student.update({ where: { id: sid }, data: { needs_placement_review: false } }),
  ]);

  const afterYear = await p.studentVolunteerPlacement.findMany({ where: { student_id: sid }, orderBy: { id: "asc" } });
  const stateOf = (id) => afterYear.find((x) => x.id === id).is_active;
  ok("המקומות שסומנו נשארו פעילים (א', ג')", stateOf(plA.id) === true && stateOf(plC.id) === true);
  ok("המקום שלא סומן הסתיים (ב')", stateOf(plB.id) === false);
  ok("לשעות של המקום שהסתיים לא נגעו", (await p.volunteerHours.count({ where: { placement_id: plB.id } })) === 1);
  ok("סך השעות לא השתנה אחרי מעבר השנה", (await p.volunteerHours.findMany({ where: { student_id: sid } })).reduce((s2, h) => s2 + h.calculated_hours, 0) === 8);
  ok("דגל הבקשה התנקה", (await p.student.findUnique({ where: { id: sid } })).needs_placement_review === false);

  const afterBanner = await get("/student");
  ok("הבאנר נעלם אחרי הבחירה", !afterBanner.html.includes("שנת לימודים חדשה"));

  // --- ניקוי ---
  await p.volunteerPlace.deleteMany({ where: { id: { in: [placeA.id, placeB.id, placeC.id] } } }).catch(() => {});
} finally {
  if (userId) await p.user.deleteMany({ where: { id: userId } });
  await p.volunteerPlace.deleteMany({ where: { supervisor_email: { in: ["__tmp_a__@x.il", "__tmp_b__@x.il", "__tmp_c__@x.il"] } } }).catch(() => {});
  const leftUser = await p.user.count({ where: { email: TMP_EMAIL } });
  const leftPlaces = await p.volunteerPlace.count({ where: { supervisor_email: { in: ["__tmp_a__@x.il", "__tmp_b__@x.il", "__tmp_c__@x.il"] } } });
  ok(`ניקוי נתונים זמניים (משתמשים: ${leftUser}, מקומות: ${leftPlaces})`, leftUser === 0 && leftPlaces === 0);
  await p.$disconnect();
}

console.log(all ? "\n🎉 ALL PASSED" : "\n⚠️ SOME FAILED");
process.exit(all ? 0 : 1);
