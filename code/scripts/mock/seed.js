// code/scripts/mock/seed.js
import { prisma } from "../../src/lib/prisma.js";

async function main() {
  console.log("🌱 Seeding database...");

  // --- Create Professor User ---
  const professor = await prisma.user.create({
    data: {
      email: "tpowell@ucsd.edu",
      name: "Prof. Powell",
      pronouns: "he/him",
    },
  });

  // --- Create Class ---
  const klass = await prisma.class.create({
    data: {
      name: "CSE 210",
      quarter: "FA25",
    },
  });

  // Assign professor to class
  await prisma.classRole.create({
    data: {
      userId: professor.id,
      classId: klass.id,
      role: "PROFESSOR",
    },
  });

  // --- Create 12 Users (2 TA + 10 Students) ---
  const users = await Promise.all(
    Array.from({ length: 12 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `user${i + 1}@ucsd.edu`,
          name: `User ${i + 1}`,
          pronouns: "they/them",
        },
      })
    )
  );

  // Assign TA roles (first 2 users)
  await prisma.classRole.create({
    data: { userId: users[0].id, classId: klass.id, role: "TA" },
  });
  await prisma.classRole.create({
    data: { userId: users[1].id, classId: klass.id, role: "TA" },
  });

  // Assign remaining 10 as students
  const students = users.slice(2);
  await Promise.all(
    students.map((student) =>
      prisma.classRole.create({
        data: {
          userId: student.id,
          classId: klass.id,
          role: "STUDENT",
        },
      })
    )
  );

  // --- Create Groups ---
  const group1 = await prisma.group.create({
    data: { name: "Team Alpha", classId: klass.id },
  });
  const group2 = await prisma.group.create({
    data: { name: "Team Beta", classId: klass.id },
  });

  // --- Assign Leaders ---
  await prisma.groupRole.create({
    data: { userId: students[0].id, groupId: group1.id, role: "LEADER" },
  });
  await prisma.groupRole.create({
    data: { userId: students[1].id, groupId: group2.id, role: "LEADER" },
  });

  // --- Assign Remaining Members ---
  await Promise.all(
    students.slice(2).map((student, i) =>
      prisma.groupRole.create({
        data: {
          userId: student.id,
          groupId: i % 2 === 0 ? group1.id : group2.id,
          role: "MEMBER",
        },
      })
    )
  );

  console.log("✅ Seed complete!");
  console.log("Professor:", professor.email);
  console.log("Class:", klass.name);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
