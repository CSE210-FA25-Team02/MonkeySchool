// code/scripts/mock/seed-data/class-roles.js
import { prisma } from "../../../src/lib/prisma.js";

/**
 * Assign professors to their classes
 */
export async function assignProfessors(professors, classes) {
  console.log("Assigning professors to classes...");

  await Promise.all([
    // Prof Powell teaches 4 classes
    ...classes.slice(0, 4).map((cls) =>
      prisma.classRole.upsert({
        where: {
          user_class_unique: {
            userId: professors[0].id,
            classId: cls.id,
          },
        },
        update: { role: "PROFESSOR" },
        create: {
          userId: professors[0].id,
          classId: cls.id,
          role: "PROFESSOR",
        },
      }),
    ),
    // Prof Smith teaches 4 classes
    ...classes.slice(4, 8).map((cls) =>
      prisma.classRole.upsert({
        where: {
          user_class_unique: {
            userId: professors[1].id,
            classId: cls.id,
          },
        },
        update: { role: "PROFESSOR" },
        create: {
          userId: professors[1].id,
          classId: cls.id,
          role: "PROFESSOR",
        },
      }),
    ),
    // Prof Johnson teaches 4 classes
    ...classes.slice(8, 12).map((cls) =>
      prisma.classRole.upsert({
        where: {
          user_class_unique: {
            userId: professors[2].id,
            classId: cls.id,
          },
        },
        update: { role: "PROFESSOR" },
        create: {
          userId: professors[2].id,
          classId: cls.id,
          role: "PROFESSOR",
        },
      }),
    ),
  ]);

  console.log("Professors assigned");
}

/**
 * Assign TAs, Tutors, and Students to classes
 */
export async function assignUserRoles(users, classes) {
  console.log("Assigning user roles...");

  // User 1: TA in 8 classes (for testing multiple classes display)
  await Promise.all(
    classes.slice(0, 8).map((cls) =>
      prisma.classRole.upsert({
        where: {
          user_class_unique: {
            userId: users[0].id,
            classId: cls.id,
          },
        },
        update: { role: "TA" },
        create: { userId: users[0].id, classId: cls.id, role: "TA" },
      }),
    ),
  );

  // User 2: TA in 3 classes
  await Promise.all([
    prisma.classRole.upsert({
      where: {
        user_class_unique: {
          userId: users[1].id,
          classId: classes[0].id,
        },
      },
      update: { role: "TA" },
      create: { userId: users[1].id, classId: classes[0].id, role: "TA" },
    }),
    prisma.classRole.upsert({
      where: {
        user_class_unique: {
          userId: users[1].id,
          classId: classes[8].id,
        },
      },
      update: { role: "TA" },
      create: { userId: users[1].id, classId: classes[8].id, role: "TA" },
    }),
    prisma.classRole.upsert({
      where: {
        user_class_unique: {
          userId: users[1].id,
          classId: classes[9].id,
        },
      },
      update: { role: "TA" },
      create: { userId: users[1].id, classId: classes[9].id, role: "TA" },
    }),
  ]);

  // User 3-4: Tutors in various classes
  await Promise.all([
    ...classes.slice(0, 3).map((cls) =>
      prisma.classRole.upsert({
        where: {
          user_class_unique: {
            userId: users[2].id,
            classId: cls.id,
          },
        },
        update: { role: "TUTOR" },
        create: { userId: users[2].id, classId: cls.id, role: "TUTOR" },
      }),
    ),
    ...classes.slice(3, 5).map((cls) =>
      prisma.classRole.upsert({
        where: {
          user_class_unique: {
            userId: users[3].id,
            classId: cls.id,
          },
        },
        update: { role: "TUTOR" },
        create: { userId: users[3].id, classId: cls.id, role: "TUTOR" },
      }),
    ),
  ]);

  // User 5: Student in 5 classes (for testing multiple classes)
  await Promise.all(
    classes.slice(0, 5).map((cls) =>
      prisma.classRole.upsert({
        where: {
          user_class_unique: {
            userId: users[4].id,
            classId: cls.id,
          },
        },
        update: { role: "STUDENT" },
        create: { userId: users[4].id, classId: cls.id, role: "STUDENT" },
      }),
    ),
  );

  // Users 6-20: Students distributed across classes
  const studentAssignments = [];
  for (let i = 5; i < 20; i++) {
    const numClasses = Math.floor(Math.random() * 3) + 2; // 2-4 classes
    const assignedClasses = new Set();

    while (assignedClasses.size < numClasses) {
      const randomClassIdx = Math.floor(Math.random() * classes.length);
      if (!assignedClasses.has(randomClassIdx)) {
        assignedClasses.add(randomClassIdx);
        studentAssignments.push(
          prisma.classRole.upsert({
            where: {
              user_class_unique: {
                userId: users[i].id,
                classId: classes[randomClassIdx].id,
              },
            },
            update: { role: "STUDENT" },
            create: {
              userId: users[i].id,
              classId: classes[randomClassIdx].id,
              role: "STUDENT",
            },
          }),
        );
      }
    }
  }
  await Promise.all(studentAssignments);

  console.log("User roles assigned");
}

/**
 * Create groups and assign group roles for CSE 210
 */
export async function createGroupsAndRoles(users, classes) {
  console.log("Creating groups...");

  // Find or create groups
  let group1 = await prisma.group.findFirst({
    where: { name: "Team Alpha", classId: classes[0].id },
  });
  if (!group1) {
    group1 = await prisma.group.create({
      data: { name: "Team Alpha", classId: classes[0].id },
    });
  }

  let group2 = await prisma.group.findFirst({
    where: { name: "Team Beta", classId: classes[0].id },
  });
  if (!group2) {
    group2 = await prisma.group.create({
      data: { name: "Team Beta", classId: classes[0].id },
    });
  }

  // Assign group leaders
  await Promise.all([
    prisma.groupRole.upsert({
      where: {
        user_group_unique: {
          userId: users[4].id,
          groupId: group1.id,
        },
      },
      update: { role: "LEADER" },
      create: { userId: users[4].id, groupId: group1.id, role: "LEADER" },
    }),
    prisma.groupRole.upsert({
      where: {
        user_group_unique: {
          userId: users[5].id,
          groupId: group2.id,
        },
      },
      update: { role: "LEADER" },
      create: { userId: users[5].id, groupId: group2.id, role: "LEADER" },
    }),
  ]);

  // Assign group members
  await Promise.all([
    prisma.groupRole.upsert({
      where: {
        user_group_unique: {
          userId: users[6].id,
          groupId: group1.id,
        },
      },
      update: { role: "MEMBER" },
      create: { userId: users[6].id, groupId: group1.id, role: "MEMBER" },
    }),
    prisma.groupRole.upsert({
      where: {
        user_group_unique: {
          userId: users[7].id,
          groupId: group1.id,
        },
      },
      update: { role: "MEMBER" },
      create: { userId: users[7].id, groupId: group1.id, role: "MEMBER" },
    }),
    prisma.groupRole.upsert({
      where: {
        user_group_unique: {
          userId: users[8].id,
          groupId: group2.id,
        },
      },
      update: { role: "MEMBER" },
      create: { userId: users[8].id, groupId: group2.id, role: "MEMBER" },
    }),
    prisma.groupRole.upsert({
      where: {
        user_group_unique: {
          userId: users[9].id,
          groupId: group2.id,
        },
      },
      update: { role: "MEMBER" },
      create: { userId: users[9].id, groupId: group2.id, role: "MEMBER" },
    }),
  ]);

  // Assign group supervisors
  await Promise.all([
    prisma.groupSupervisor.upsert({
      where: {
        user_group_supervisor_unique: {
          userId: users[0].id,
          groupId: group1.id,
        },
      },
      update: {},
      create: { userId: users[0].id, groupId: group1.id },
    }),
    prisma.groupSupervisor.upsert({
      where: {
        user_group_supervisor_unique: {
          userId: users[1].id,
          groupId: group2.id,
        },
      },
      update: {},
      create: { userId: users[1].id, groupId: group2.id },
    }),
  ]);

  console.log("Groups created");
}
