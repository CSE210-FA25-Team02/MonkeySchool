/*
  Warnings:

  - Added the required column `updatedAt` to the `groups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "leaderId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
