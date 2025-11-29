// code/scripts/mock/db-seed.js
import { prisma } from "../../src/lib/prisma.js";
import { createUsers } from "./seed-data/class-list-users.js";
import { createClasses } from "./seed-data/class-list-classes.js";
import {
  assignProfessors,
  assignUserRoles,
  createGroupsAndRoles,
} from "./seed-data/class-list-class-roles.js";

import { createDefaultCategories } from "./seed-data/activity-list.js";

async function main() {
  console.log("Seeding database with multiple classes...");

  // Create users (professors and students)
  const { professors, users } = await createUsers();

  // Create classes
  const classes = await createClasses();

  // Assign professors to classes
  await assignProfessors(professors, classes);

  // Assign user roles (TAs, Tutors, Students)
  await assignUserRoles(users, classes);

  // Create groups and assign group roles
  await createGroupsAndRoles(users, classes);

  // Create default activity categories
  await createDefaultCategories();

  // Summary
  console.log("\nSeed complete!");
  console.log("\nSummary:");
  console.log(`   - ${professors.length} Professors`);
  console.log(`   - ${classes.length} Classes`);
  console.log(`   - ${users.length} Users (TAs, Tutors, Students)`);
  console.log(`   - 2 Groups in ${classes[0].name}`);
  console.log("\nTest Users:");
  console.log(`   - ${users[0].email} (user1): TA in 8 classes`);
  console.log(`   - ${users[1].email} (user2): TA in 3 classes`);
  console.log(`   - ${users[4].email} (user5): Student in 5 classes`);
  console.log(`   - ${professors[0].email}: Professor in 4 classes`);

  console.log("\nTest URL:");
  console.log(
    `   http://localhost:3000/classes/my-classes?userId=${users[0].id}`,
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
