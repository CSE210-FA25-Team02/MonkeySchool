-- CreateEnum
CREATE TYPE "CategoryRole" AS ENUM ('STUDENT', 'TA', 'ALL');

-- AlterTable
-- ALTER TABLE "users" ADD COLUMN     "isProf" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMin" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "role" "CategoryRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_userId_idx" ON "activity"("userId");

-- CreateIndex
CREATE INDEX "activity_categoryId_idx" ON "activity"("categoryId");

-- CreateIndex
CREATE INDEX "activity_startTime_idx" ON "activity"("startTime");

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "activity_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
