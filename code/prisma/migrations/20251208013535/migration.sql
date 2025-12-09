-- CreateTable
CREATE TABLE "work_journals" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mood" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_journals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_journals_userId_idx" ON "work_journals"("userId");

-- CreateIndex
CREATE INDEX "work_journals_createdAt_idx" ON "work_journals"("createdAt");

-- AddForeignKey
ALTER TABLE "work_journals" ADD CONSTRAINT "work_journals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
