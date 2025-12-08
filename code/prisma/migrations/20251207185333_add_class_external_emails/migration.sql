-- CreateTable
CREATE TABLE "class_external_emails" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_external_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_external_emails_email_idx" ON "class_external_emails"("email");

-- CreateIndex
CREATE INDEX "class_external_emails_classId_idx" ON "class_external_emails"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "class_external_emails_email_classId_key" ON "class_external_emails"("email", "classId");

-- AddForeignKey
ALTER TABLE "class_external_emails" ADD CONSTRAINT "class_external_emails_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
