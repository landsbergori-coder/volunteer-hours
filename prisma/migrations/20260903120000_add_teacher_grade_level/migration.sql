-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "grade_level" "GradeLevel" NOT NULL DEFAULT 'GRADE_10';

-- השלמת שכבה למחנכים קיימים לפי הקידומת בשם הכיתה.
-- ברירת המחדל היא GRADE_10, ולכן מטופלות כאן רק י"א ו-י"ב.
-- מכוסים גם גרשיים רגילים (") וגם גרשיים עבריים (״), וגם כתיב ללא גרשיים.
UPDATE "Teacher" SET "grade_level" = 'GRADE_12'
WHERE "class_name" LIKE 'י"ב%' OR "class_name" LIKE 'י״ב%' OR "class_name" LIKE 'יב%';

UPDATE "Teacher" SET "grade_level" = 'GRADE_11'
WHERE "class_name" LIKE 'י"א%' OR "class_name" LIKE 'י״א%' OR "class_name" LIKE 'יא%';
