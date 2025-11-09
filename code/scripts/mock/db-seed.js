// code/scripts/mock/db-seed.js
import { prisma } from "../../src/lib/prisma.js";

async function main() {
  console.log("🌱 Seeding database...");

  // --- Create Professor ---
  const professor = await prisma.user.create({
    data: {
      email: "tpowell@ucsd.edu",
      name: "Prof. Powell",
      pronouns: "he/him",
      isProf: true
    },
  });

  // --- Create Class ---
  const klass = await prisma.class.create({
    data: {
      name: "CSE 210",
      quarter: "FA25",
    },
  });

  // Assign professor
  await prisma.classRole.create({
    data: { userId: professor.id, classId: klass.id, role: "PROFESSOR" },
  });

  // --- Create 14 Users: 2 TA, 2 Tutor, 10 Students ---
  const users = await Promise.all(
    Array.from({ length: 14 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `user${i + 1}@ucsd.edu`,
          name: `User ${i + 1}`,
          pronouns: "they/them",
          isProf: false
        },
      })
    )
  );

  // Assign 2 TAs
  await prisma.classRole.create({
    data: { userId: users[0].id, classId: klass.id, role: "TA" },
  });
  await prisma.classRole.create({
    data: { userId: users[1].id, classId: klass.id, role: "TA" },
  });

  // Assign 2 Tutors
  await prisma.classRole.create({
    data: { userId: users[2].id, classId: klass.id, role: "TUTOR" },
  });
  await prisma.classRole.create({
    data: { userId: users[3].id, classId: klass.id, role: "TUTOR" },
  });

  // Remaining 10 → Students
  const students = users.slice(4);
  await Promise.all(
    students.map((student) =>
      prisma.classRole.create({
        data: { userId: student.id, classId: klass.id, role: "STUDENT" },
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

  // --- Leaders ---
  await prisma.groupRole.create({
    data: { userId: students[0].id, groupId: group1.id, role: "LEADER" },
  });
  await prisma.groupRole.create({
    data: { userId: students[1].id, groupId: group2.id, role: "LEADER" },
  });

  // --- Member assignment ---
  await Promise.all(
    students.slice(2).map((s, i) =>
      prisma.groupRole.create({
        data: {
          userId: s.id,
          groupId: i % 2 === 0 ? group1.id : group2.id,
          role: "MEMBER",
        },
      })
    )
  );

  // --- Supervisors (2 TAs each supervise 1 group) ---
  await prisma.groupSupervisor.create({
    data: { userId: users[0].id, groupId: group1.id }, // TA 1 supervises Alpha
  });
  await prisma.groupSupervisor.create({
    data: { userId: users[1].id, groupId: group2.id }, // TA 2 supervises Beta
  });

  console.log("✅ Seed complete!");
  console.log("Professor:", professor.email);
  console.log("Class:", klass.name);
  console.log("Groups:", [group1.name, group2.name]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
