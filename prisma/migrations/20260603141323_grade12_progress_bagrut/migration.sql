-- AlterEnum
ALTER TYPE "GradeLevel" ADD VALUE 'GRADE_12';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "bagrut_track" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needs_placement_review" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VolunteerHours" ADD COLUMN     "grade_level" "GradeLevel";
