-- CreateTable
CREATE TABLE "pulse_entries" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pulse_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pulse_entries_userId_classId_date_key" ON "pulse_entries"("userId", "classId", "date");

-- CreateIndex
CREATE INDEX "pulse_entries_classId_date_idx" ON "pulse_entries"("classId", "date");

-- CreateIndex
CREATE INDEX "pulse_entries_userId_classId_idx" ON "pulse_entries"("userId", "classId");

-- CreateIndex
CREATE INDEX "pulse_entries_date_idx" ON "pulse_entries"("date");

-- AddForeignKey
ALTER TABLE "pulse_entries" ADD CONSTRAINT "pulse_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pulse_entries" ADD CONSTRAINT "pulse_entries_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint: Ensure pulse value is between 1 and 5
ALTER TABLE "pulse_entries" ADD CONSTRAINT "pulse_entries_value_check" CHECK ("value" >= 1 AND "value" <= 5);

