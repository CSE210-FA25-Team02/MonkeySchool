// code/tests/utils/reset-db.js
import { prisma } from "../../src/lib/prisma.js";

export async function resetDatabase() {
  // Delete lowest-level dependent relations first
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendancePoll.deleteMany();
  await prisma.courseSession.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.activityCategory.deleteMany();
  await prisma.groupSupervisor.deleteMany();
  await prisma.groupRole.deleteMany();
  await prisma.group.deleteMany();
  await prisma.classRole.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
}
