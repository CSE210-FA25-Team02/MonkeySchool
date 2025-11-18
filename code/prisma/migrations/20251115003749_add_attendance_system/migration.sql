-- CreateTable
CREATE TABLE "course_sessions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_polls" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "attendance_polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pollId" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_polls_code_key" ON "attendance_polls"("code");

-- CreateIndex
CREATE INDEX "course_sessions_classId_idx" ON "course_sessions"("classId");

-- CreateIndex
CREATE INDEX "course_sessions_date_idx" ON "course_sessions"("date");

-- CreateIndex
CREATE INDEX "attendance_polls_sessionId_idx" ON "attendance_polls"("sessionId");

-- CreateIndex
CREATE INDEX "attendance_polls_expiresAt_idx" ON "attendance_polls"("expiresAt");

-- CreateIndex
CREATE INDEX "attendance_polls_code_idx" ON "attendance_polls"("code");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentId_sessionId_key" ON "attendance_records"("studentId", "sessionId");

-- CreateIndex
CREATE INDEX "attendance_records_studentId_idx" ON "attendance_records"("studentId");

-- CreateIndex
CREATE INDEX "attendance_records_sessionId_idx" ON "attendance_records"("sessionId");

-- CreateIndex
CREATE INDEX "attendance_records_pollId_idx" ON "attendance_records"("pollId");

-- AddForeignKey
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_polls" ADD CONSTRAINT "attendance_polls_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "course_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_polls" ADD CONSTRAINT "attendance_polls_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "course_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "attendance_polls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

