/*
  Warnings:

  - Made the column `work_center_id` on table `Professor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `teaching_category_id` on table `Professor` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Professor" DROP CONSTRAINT "Professor_teaching_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Professor" DROP CONSTRAINT "Professor_work_center_id_fkey";

-- AlterTable
ALTER TABLE "Professor" ALTER COLUMN "work_center_id" SET NOT NULL,
ALTER COLUMN "teaching_category_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_work_center_id_fkey" FOREIGN KEY ("work_center_id") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_teaching_category_id_fkey" FOREIGN KEY ("teaching_category_id") REFERENCES "TeachingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
