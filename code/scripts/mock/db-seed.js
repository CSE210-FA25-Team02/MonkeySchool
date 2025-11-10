// code/scripts/mock/db-seed.js
import {
  prisma
} from "../../src/lib/prisma.js";

async function main() {
  console.log("🌱 Seeding database with multiple classes...");

  // --- Create Professors ---
  const professors = await Promise.all([
    prisma.user.create({
      data: {
        email: "tpowell@ucsd.edu",
        name: "Prof. Powell",
        pronouns: "he/him",
      },
    }),
    prisma.user.create({
      data: {
        email: "jsmith@ucsd.edu",
        name: "Prof. Smith",
        pronouns: "she/her",
      },
    }),
    prisma.user.create({
      data: {
        email: "mjohnson@ucsd.edu",
        name: "Prof. Johnson",
        pronouns: "they/them",
      },
    }),
  ]);

  // --- Create 20 Users for various roles ---
  const users = await Promise.all(
    Array.from({
      length: 20
    }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `user${i + 1}@ucsd.edu`,
          name: `User ${i + 1}`,
          pronouns: "they/them",
        },
      })
    )
  );

  // --- Define Classes with various names and quarters ---
  const classesData = [{
      name: "CSE 210",
      quarter: "FA25"
    },
    {
      name: "CSE 110",
      quarter: "FA25"
    },
    {
      name: "CSE 100",
      quarter: "WI26"
    },
    {
      name: "Advanced Software Engineering and Project Management",
      quarter: "FA25"
    },
    {
      name: "Data Structures",
      quarter: "WI26"
    },
    {
      name: "CSE 141",
      quarter: "SP26"
    },
    {
      name: "Computer Architecture",
      quarter: "SP26"
    },
    {
      name: "Machine Learning Fundamentals",
      quarter: "FA25"
    },
    {
      name: "Web Development",
      quarter: "WI26"
    },
    {
      name: "CSE 230",
      quarter: "FA25"
    },
    {
      name: "Database Systems",
      quarter: "SP26"
    },
    {
      name: "Operating Systems Design and Implementation",
      quarter: "WI26"
    },
  ];

  // --- Create Classes ---
  const classes = await Promise.all(
    classesData.map((data, i) =>
      prisma.class.create({
        data: {
          name: data.name,
          quarter: data.quarter,
        },
      })
    )
  );

  console.log(`✅ Created ${classes.length} classes`);

  // --- Assign Professors to Classes ---
  await Promise.all([
    // Prof Powell teaches 4 classes
    prisma.classRole.create({
      data: {
        userId: professors[0].id,
        classId: classes[0].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[0].id,
        classId: classes[1].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[0].id,
        classId: classes[2].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[0].id,
        classId: classes[3].id,
        role: "PROFESSOR"
      }
    }),

    // Prof Smith teaches 4 classes
    prisma.classRole.create({
      data: {
        userId: professors[1].id,
        classId: classes[4].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[1].id,
        classId: classes[5].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[1].id,
        classId: classes[6].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[1].id,
        classId: classes[7].id,
        role: "PROFESSOR"
      }
    }),

    // Prof Johnson teaches 4 classes
    prisma.classRole.create({
      data: {
        userId: professors[2].id,
        classId: classes[8].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[2].id,
        classId: classes[9].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[2].id,
        classId: classes[10].id,
        role: "PROFESSOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: professors[2].id,
        classId: classes[11].id,
        role: "PROFESSOR"
      }
    }),
  ]);

  // --- Assign User Roles (Creating varied participation) ---

  // User 1: TA in 8 classes (for testing multiple classes display)
  await Promise.all([
    prisma.classRole.create({
      data: {
        userId: users[0].id,
        classId: classes[0].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[0].id,
        classId: classes[1].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[0].id,
        classId: classes[2].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[0].id,
        classId: classes[3].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[0].id,
        classId: classes[4].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[0].id,
        classId: classes[5].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[0].id,
        classId: classes[6].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[0].id,
        classId: classes[7].id,
        role: "TA"
      }
    }),
  ]);

  // User 2: TA in 3 classes
  await Promise.all([
    prisma.classRole.create({
      data: {
        userId: users[1].id,
        classId: classes[0].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[1].id,
        classId: classes[8].id,
        role: "TA"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[1].id,
        classId: classes[9].id,
        role: "TA"
      }
    }),
  ]);

  // User 3-4: Tutors in various classes
  await Promise.all([
    prisma.classRole.create({
      data: {
        userId: users[2].id,
        classId: classes[0].id,
        role: "TUTOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[2].id,
        classId: classes[1].id,
        role: "TUTOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[2].id,
        classId: classes[2].id,
        role: "TUTOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[3].id,
        classId: classes[3].id,
        role: "TUTOR"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[3].id,
        classId: classes[4].id,
        role: "TUTOR"
      }
    }),
  ]);

  // User 5: Student in 5 classes (for testing multiple classes)
  await Promise.all([
    prisma.classRole.create({
      data: {
        userId: users[4].id,
        classId: classes[0].id,
        role: "STUDENT"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[4].id,
        classId: classes[1].id,
        role: "STUDENT"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[4].id,
        classId: classes[2].id,
        role: "STUDENT"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[4].id,
        classId: classes[3].id,
        role: "STUDENT"
      }
    }),
    prisma.classRole.create({
      data: {
        userId: users[4].id,
        classId: classes[4].id,
        role: "STUDENT"
      }
    }),
  ]);

  // Users 6-20: Students distributed across classes
  const studentAssignments = [];
  for (let i = 5; i < 20; i++) {
    // Each student in 2-4 random classes
    const numClasses = Math.floor(Math.random() * 3) + 2; // 2-4 classes
    const assignedClasses = new Set();

    while (assignedClasses.size < numClasses) {
      const randomClassIdx = Math.floor(Math.random() * classes.length);
      if (!assignedClasses.has(randomClassIdx)) {
        assignedClasses.add(randomClassIdx);
        studentAssignments.push(
          prisma.classRole.create({
            data: {
              userId: users[i].id,
              classId: classes[randomClassIdx].id,
              role: "STUDENT",
            },
          })
        );
      }
    }
  }
  await Promise.all(studentAssignments);

  // --- Create Groups for CSE 210 ---
  const group1 = await prisma.group.create({
    data: {
      name: "Team Alpha",
      classId: classes[0].id
    },
  });
  const group2 = await prisma.group.create({
    data: {
      name: "Team Beta",
      classId: classes[0].id
    },
  });

  // --- Assign Group Leaders and Members ---
  await prisma.groupRole.create({
    data: {
      userId: users[4].id,
      groupId: group1.id,
      role: "LEADER"
    },
  });
  await prisma.groupRole.create({
    data: {
      userId: users[5].id,
      groupId: group2.id,
      role: "LEADER"
    },
  });

  // Add some members
  await Promise.all([
    prisma.groupRole.create({
      data: {
        userId: users[6].id,
        groupId: group1.id,
        role: "MEMBER"
      }
    }),
    prisma.groupRole.create({
      data: {
        userId: users[7].id,
        groupId: group1.id,
        role: "MEMBER"
      }
    }),
    prisma.groupRole.create({
      data: {
        userId: users[8].id,
        groupId: group2.id,
        role: "MEMBER"
      }
    }),
    prisma.groupRole.create({
      data: {
        userId: users[9].id,
        groupId: group2.id,
        role: "MEMBER"
      }
    }),
  ]);

  // --- Assign Group Supervisors ---
  await prisma.groupSupervisor.create({
    data: {
      userId: users[0].id,
      groupId: group1.id
    }, // TA 1 supervises Alpha
  });
  await prisma.groupSupervisor.create({
    data: {
      userId: users[1].id,
      groupId: group2.id
    }, // TA 2 supervises Beta
  });

  console.log("\n✅ Seed complete!");
  console.log("\n📊 Summary:");
  console.log(`   - ${professors.length} Professors`);
  console.log(`   - ${classes.length} Classes`);
  console.log(`   - ${users.length} Users (TAs, Tutors, Students)`);
  console.log(`   - 2 Groups in ${classes[0].name}`);
  console.log("\n🧪 Test Users:");
  console.log(`   - ${users[0].email} (user1): TA in 8 classes`);
  console.log(`   - ${users[1].email} (user2): TA in 3 classes`);
  console.log(`   - ${users[4].email} (user5): Student in 5 classes`);
  console.log(`   - ${professors[0].email}: Professor in 4 classes`);

  // Get user1's ID for testing
  const user1 = users[0];
  console.log("\n🔗 Test URL:");
  console.log(`   http://localhost:3000/api/classes/my-classes?userId=${user1.id}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });