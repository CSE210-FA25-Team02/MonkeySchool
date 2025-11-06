// code/tests/utils/debug.js

import { prisma } from "../../src/lib/prisma.js";

export async function debugDB() {
  console.log("\n===== DATABASE STATE =====");
  console.log("Users:", await prisma.user.findMany());
  console.log("Classes:", await prisma.class.findMany());
  console.log("ClassRoles:", await prisma.classRole.findMany());
  console.log("Groups:", await prisma.group.findMany());
  console.log("GroupRoles:", await prisma.groupRole.findMany());
  console.log("==========================\n");
}
