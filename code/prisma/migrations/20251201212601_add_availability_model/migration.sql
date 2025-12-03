-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "availabilities_userId_dayOfWeek_idx" ON "availabilities"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "availabilities_dayOfWeek_startTime_idx" ON "availabilities"("dayOfWeek", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_userId_dayOfWeek_startTime_endTime_key" ON "availabilities"("userId", "dayOfWeek", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
