/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `activity_category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classId` to the `activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "activity" ADD COLUMN     "classId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "activity_classId_idx" ON "activity"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_category_name_key" ON "activity_category"("name");

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
