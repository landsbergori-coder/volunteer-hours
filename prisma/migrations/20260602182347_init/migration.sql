-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('GRADE_10', 'GRADE_11');

-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('A', 'B');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "national_id" TEXT NOT NULL,
    "grade_level" "GradeLevel" NOT NULL,
    "class_name" TEXT NOT NULL,
    "homeroom_teacher_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "class_name" TEXT NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerPlace" (
    "id" SERIAL NOT NULL,
    "place_name" TEXT NOT NULL,
    "supervisor_name" TEXT NOT NULL,
    "supervisor_phone" TEXT NOT NULL,
    "supervisor_email" TEXT NOT NULL,
    "supervisor_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentVolunteerPlacement" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "volunteer_place_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentVolunteerPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerHours" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "volunteer_place_id" INTEGER NOT NULL,
    "placement_id" INTEGER NOT NULL,
    "volunteer_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "calculated_hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "semester" "Semester" NOT NULL,
    "content" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisorEvaluation" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "volunteer_place_id" INTEGER NOT NULL,
    "supervisor_user_id" INTEGER NOT NULL,
    "evaluation_text" TEXT NOT NULL,
    "evaluation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupervisorEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_user_id_key" ON "Student"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_national_id_key" ON "Student"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_user_id_key" ON "Teacher"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Reflection_student_id_semester_key" ON "Reflection"("student_id", "semester");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_homeroom_teacher_id_fkey" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerPlace" ADD CONSTRAINT "VolunteerPlace_supervisor_user_id_fkey" FOREIGN KEY ("supervisor_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentVolunteerPlacement" ADD CONSTRAINT "StudentVolunteerPlacement_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentVolunteerPlacement" ADD CONSTRAINT "StudentVolunteerPlacement_volunteer_place_id_fkey" FOREIGN KEY ("volunteer_place_id") REFERENCES "VolunteerPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerHours" ADD CONSTRAINT "VolunteerHours_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerHours" ADD CONSTRAINT "VolunteerHours_volunteer_place_id_fkey" FOREIGN KEY ("volunteer_place_id") REFERENCES "VolunteerPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerHours" ADD CONSTRAINT "VolunteerHours_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "StudentVolunteerPlacement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorEvaluation" ADD CONSTRAINT "SupervisorEvaluation_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorEvaluation" ADD CONSTRAINT "SupervisorEvaluation_volunteer_place_id_fkey" FOREIGN KEY ("volunteer_place_id") REFERENCES "VolunteerPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorEvaluation" ADD CONSTRAINT "SupervisorEvaluation_supervisor_user_id_fkey" FOREIGN KEY ("supervisor_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
