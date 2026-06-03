import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const ok = (l, c) => { console.log(`${c ? "✅" : "❌"} ${l}`); return c; };
const sumGrade = (hours, g) => hours.filter((h) => h.grade_level === g).reduce((s, h) => s + h.calculated_hours, 0);
let all = true;

const load = async (email) => {
  const u = await p.user.findUnique({ where: { email }, include: { student: { include: { hours: true } } } });
  return u?.student;
};

const noa = await load("noa@student.il");
all &= ok(`noa grade10 hours = ${sumGrade(noa.hours, "GRADE_10")} (expect 10)`, sumGrade(noa.hours, "GRADE_10") === 10);
const maya = await load("maya@student.il");
all &= ok(`maya grade11 hours = ${sumGrade(maya.hours, "GRADE_11")} (expect 7)`, sumGrade(maya.hours, "GRADE_11") === 7);

const yael = await load("yael@student.il");
const b = { 10: sumGrade(yael.hours, "GRADE_10"), 11: sumGrade(yael.hours, "GRADE_11"), 12: sumGrade(yael.hours, "GRADE_12") };
all &= ok(`yael 60/60/60 -> ${b[10]}/${b[11]}/${b[12]}`, b[10] === 60 && b[11] === 60 && b[12] === 60);
all &= ok("yael bagrut eligible", b[10] >= 60 && b[11] >= 60 && b[12] >= 60);
all &= ok("yael on bagrut track", yael.bagrut_track === true);
all &= ok("noa NOT bagrut eligible", !(sumGrade(noa.hours, "GRADE_10") >= 60));

console.log("\n--- year transition (throwaway data) ---");
const place = await p.volunteerPlace.findFirst();
const mk = async (grade, email) => {
  const u = await p.user.create({ data: { full_name: "TMP " + grade, email, password_hash: "x", role: "STUDENT", student: { create: { first_name: "TMP", last_name: grade, national_id: "7" + Math.floor(Math.random() * 100000000), grade_level: grade, class_name: "__yr__" } } }, include: { student: true } });
  const pl = await p.studentVolunteerPlacement.create({ data: { student_id: u.student.id, volunteer_place_id: place.id, is_active: true } });
  await p.volunteerHours.create({ data: { student_id: u.student.id, volunteer_place_id: place.id, placement_id: pl.id, volunteer_date: new Date(), start_time: "08:00", end_time: "10:00", calculated_hours: 2, grade_level: grade, description: "tmp" } });
  return u;
};
const t10 = await mk("GRADE_10", "__yr10__@x.il");
const t11 = await mk("GRADE_11", "__yr11__@x.il");
const t12 = await mk("GRADE_12", "__yr12__@x.il");
const ids = [t10, t11, t12].map((u) => u.id);

await p.$transaction([
  p.user.updateMany({ where: { id: { in: ids }, archived_at: null, student: { grade_level: "GRADE_12" } }, data: { archived_at: new Date() } }),
  p.student.updateMany({ where: { user_id: { in: ids }, grade_level: "GRADE_11" }, data: { grade_level: "GRADE_12", needs_placement_review: true } }),
  p.student.updateMany({ where: { user_id: { in: ids }, grade_level: "GRADE_10" }, data: { grade_level: "GRADE_11", needs_placement_review: true } }),
]);

const re = async (id) => p.user.findUnique({ where: { id }, include: { student: { include: { hours: true } } } });
const a10 = await re(t10.id), a11 = await re(t11.id), a12 = await re(t12.id);
all &= ok("grade10 -> grade11", a10.student.grade_level === "GRADE_11");
all &= ok("grade11 -> grade12", a11.student.grade_level === "GRADE_12");
all &= ok("grade12 -> archived", a12.archived_at !== null);
all &= ok("promoted flagged needs_placement_review", a10.student.needs_placement_review && a11.student.needs_placement_review);
all &= ok("hours kept original grade snapshot", a10.student.hours[0].grade_level === "GRADE_10" && a11.student.hours[0].grade_level === "GRADE_11");

await p.user.deleteMany({ where: { id: { in: ids } } });
all &= ok("cleanup", (await p.user.count({ where: { id: { in: ids } } })) === 0);

await p.$disconnect();
console.log(all ? "\n🎉 ALL PASSED" : "\n⚠️ SOME FAILED");
process.exit(all ? 0 : 1);
