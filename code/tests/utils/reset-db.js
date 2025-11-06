// code/tests/utils/reset-db.js

import { prisma } from "../../src/lib/prisma.js";

export async function resetDatabase() {
  await prisma.groupRole.deleteMany();
  await prisma.group.deleteMany();
  await prisma.classRole.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
}
