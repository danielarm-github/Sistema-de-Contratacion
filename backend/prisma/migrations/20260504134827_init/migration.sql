-- AlterTable
ALTER TABLE "Professor" ADD COLUMN     "scientific_degree_id" INTEGER,
ADD COLUMN     "teaching_category_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_scientific_degree_id_fkey" FOREIGN KEY ("scientific_degree_id") REFERENCES "ScientificDegree"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_teaching_category_id_fkey" FOREIGN KEY ("teaching_category_id") REFERENCES "TeachingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
