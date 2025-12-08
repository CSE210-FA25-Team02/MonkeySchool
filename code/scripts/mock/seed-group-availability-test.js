#!/usr/bin/env node

/**
 * Group Availability Test Data
 * Creates test data with j9yin@ucsd.edu for testing the new group availability feature
 *
 * Usage: node scripts/seed-group-availability-test.js
 */

import { prisma } from "../../src/lib/prisma.js";

async function seedGroupAvailabilityTest() {
  console.log("🌱 Creating test data for Group Availability feature...");

  try {
    // Create test class
    console.log("🏫 Creating CSE 210 test class...");
    const testClass = await prisma.class.create({
      data: {
        name: "CSE 210 - Software Engineering",
        quarter: "Fall 2024",
      },
    });

    // Create/find you and test teammates
    console.log("👥 Creating/finding users...");
    const users = await Promise.all([
      // You - the main test user (use existing or create)
      prisma.user.upsert({
        where: { email: "j9yin@ucsd.edu" },
        update: {},
        create: {
          email: "j9yin@ucsd.edu",
          name: "Jiayu Yin",
          preferredName: "Jiayu",
        },
      }),
      // Teammates for Group 1
      prisma.user.upsert({
        where: { email: "alice@ucsd.edu" },
        update: {},
        create: {
          email: "alice@ucsd.edu",
          name: "Alice Johnson",
          preferredName: "Alice",
        },
      }),
      prisma.user.upsert({
        where: { email: "bob@ucsd.edu" },
        update: {},
        create: {
          email: "bob@ucsd.edu",
          name: "Bob Chen",
          preferredName: "Bob",
        },
      }),
      prisma.user.upsert({
        where: { email: "charlie@ucsd.edu" },
        update: {},
        create: {
          email: "charlie@ucsd.edu",
          name: "Charlie Rodriguez",
          preferredName: "Charlie",
        },
      }),
      // Teammates for Group 2 (you'll be in this one too)
      prisma.user.upsert({
        where: { email: "diana@ucsd.edu" },
        update: {},
        create: {
          email: "diana@ucsd.edu",
          name: "Diana Kim",
          preferredName: "Diana",
        },
      }),
      prisma.user.upsert({
        where: { email: "eve@ucsd.edu" },
        update: {},
        create: {
          email: "eve@ucsd.edu",
          name: "Eve Thompson",
          preferredName: "Eve",
        },
      }),
    ]);

    const [you, alice, bob, charlie, diana, eve] = users;

    // Create two test groups
    console.log("👥 Creating test groups...");
    const group1 = await prisma.group.create({
      data: {
        name: "Team Alpha",
        classId: testClass.id,
        mantra: "Building the future of education",
      },
    });

    const group2 = await prisma.group.create({
      data: {
        name: "Team Beta",
        classId: testClass.id,
        mantra: "Innovation through collaboration",
      },
    });

    // Add you to both groups, others to one each
    console.log("🤝 Assigning group memberships...");

    // Group 1: You (leader), Alice, Bob, Charlie (4 members total)
    await Promise.all([
      prisma.groupRole.create({
        data: {
          userId: you.id,
          groupId: group1.id,
          role: "LEADER",
        },
      }),
      prisma.groupRole.create({
        data: {
          userId: alice.id,
          groupId: group1.id,
          role: "MEMBER",
        },
      }),
      prisma.groupRole.create({
        data: {
          userId: bob.id,
          groupId: group1.id,
          role: "MEMBER",
        },
      }),
      prisma.groupRole.create({
        data: {
          userId: charlie.id,
          groupId: group1.id,
          role: "MEMBER",
        },
      }),
    ]);

    // Group 2: You, Diana (leader), Eve (3 members total)
    await Promise.all([
      prisma.groupRole.create({
        data: {
          userId: you.id,
          groupId: group2.id,
          role: "MEMBER",
        },
      }),
      prisma.groupRole.create({
        data: {
          userId: diana.id,
          groupId: group2.id,
          role: "LEADER",
        },
      }),
      prisma.groupRole.create({
        data: {
          userId: eve.id,
          groupId: group2.id,
          role: "MEMBER",
        },
      }),
    ]);

    // Create diverse availability patterns for good color testing
    console.log("📅 Creating availability patterns...");

    // Your availability - Monday to Friday 10 AM - 4 PM
    const yourAvailability = [];
    for (let day = 1; day <= 5; day++) {
      yourAvailability.push({
        userId: you.id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "16:00",
        isAvailable: true,
      });
    }

    // Alice - Available Mon/Wed/Fri 9 AM - 3 PM
    const aliceAvailability = [
      {
        userId: alice.id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "15:00",
        isAvailable: true,
      },
      {
        userId: alice.id,
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "15:00",
        isAvailable: true,
      },
      {
        userId: alice.id,
        dayOfWeek: 5,
        startTime: "09:00",
        endTime: "15:00",
        isAvailable: true,
      },
    ];

    // Bob - Available Tue/Thu 11 AM - 5 PM
    const bobAvailability = [
      {
        userId: bob.id,
        dayOfWeek: 2,
        startTime: "11:00",
        endTime: "17:00",
        isAvailable: true,
      },
      {
        userId: bob.id,
        dayOfWeek: 4,
        startTime: "11:00",
        endTime: "17:00",
        isAvailable: true,
      },
    ];

    // Charlie - Available Mon-Wed 1 PM - 6 PM
    const charlieAvailability = [
      {
        userId: charlie.id,
        dayOfWeek: 1,
        startTime: "13:00",
        endTime: "18:00",
        isAvailable: true,
      },
      {
        userId: charlie.id,
        dayOfWeek: 2,
        startTime: "13:00",
        endTime: "18:00",
        isAvailable: true,
      },
      {
        userId: charlie.id,
        dayOfWeek: 3,
        startTime: "13:00",
        endTime: "18:00",
        isAvailable: true,
      },
    ];

    // Diana - Available weekdays 8 AM - 12 PM (early bird)
    const dianaAvailability = [];
    for (let day = 1; day <= 5; day++) {
      dianaAvailability.push({
        userId: diana.id,
        dayOfWeek: day,
        startTime: "08:00",
        endTime: "12:00",
        isAvailable: true,
      });
    }

    // Eve - Available Tue-Thu 2 PM - 8 PM
    const eveAvailability = [
      {
        userId: eve.id,
        dayOfWeek: 2,
        startTime: "14:00",
        endTime: "20:00",
        isAvailable: true,
      },
      {
        userId: eve.id,
        dayOfWeek: 3,
        startTime: "14:00",
        endTime: "20:00",
        isAvailable: true,
      },
      {
        userId: eve.id,
        dayOfWeek: 4,
        startTime: "14:00",
        endTime: "20:00",
        isAvailable: true,
      },
    ];

    // Insert all availability
    const allAvailability = [
      ...yourAvailability,
      ...aliceAvailability,
      ...bobAvailability,
      ...charlieAvailability,
      ...dianaAvailability,
      ...eveAvailability,
    ];

    await prisma.availability.createMany({
      data: allAvailability,
    });

    console.log("✅ Test data created successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Class: ${testClass.name} (${testClass.id})`);
    console.log(`- Your email: ${you.email}`);
    console.log("- Groups you're in:");
    console.log(
      `  • ${testClass.id}-${group1.name} (4 members: You*, Alice, Bob, Charlie)`,
    );
    console.log(
      `  • ${testClass.id}-${group2.name} (3 members: You, Diana*, Eve)`,
    );

    console.log("\n🎨 Expected color patterns when you test:");
    console.log("Group 1 (4 members):");
    console.log(
      "  • Monday 1-3 PM: 3/4 available (You, Alice, Charlie) = Dark green",
    );
    console.log(
      "  • Tuesday 1-3 PM: 2/4 available (You, Charlie) = Medium green",
    );
    console.log(
      "  • Wednesday 1-3 PM: 3/4 available (You, Alice, Charlie) = Dark green",
    );
    console.log(
      "  • Thursday 11-4 PM: 2/4 available (You, Bob) = Medium green",
    );
    console.log(
      "  • Friday 10-3 PM: 2/4 available (You, Alice) = Medium green",
    );

    console.log("\nGroup 2 (3 members):");
    console.log(
      "  • Monday 10-12 PM: 2/3 available (You, Diana) = Medium-dark green",
    );
    console.log(
      "  • Tuesday 10-12 PM: 2/3 available (You, Diana) = Medium-dark green",
    );
    console.log(
      "  • Wednesday 2-4 PM: 2/3 available (You, Eve) = Medium-dark green",
    );

    console.log("\n🧪 To test:");
    console.log("1. Start your app and login with j9yin@ucsd.edu");
    console.log("2. Go to /availability page");
    console.log(
      "3. You should see 2 group sections below your personal calendar",
    );
    console.log("4. Test expanding/collapsing sections");
    console.log("5. Hover over time slots to see 'X/Y available' tooltips");
    console.log(
      "6. Check different color intensities based on availability overlap",
    );
  } catch (error) {
    console.error("❌ Error creating test data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedGroupAvailabilityTest()
  .then(() => {
    console.log(
      "\n🎉 Ready to test! Login with j9yin@ucsd.edu and visit /availability",
    );
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create test data:", error);
    process.exit(1);
  });
