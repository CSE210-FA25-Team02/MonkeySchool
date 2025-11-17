import { prisma } from "../../../src/lib/prisma.js";

export async function createDefaultCategories() {
  const defaultCategories = [
    {
      name: "Homework",
      description: "Assignments for students to complete",
      role: "STUDENT",
    },
    {
      name: "Lecture",
      description: "Instructor-led sessions",
      role: "ALL",
    },
    {
      name: "Grading",
      description: "Tasks assigned to TAs for grading",
      role: "TA",
    },
    {
      name: "Project",
      description: "Long-term assignments for students",
      role: "STUDENT",
    },
  ];

  for (const category of defaultCategories) {
    // Using upsert to avoid duplicates if running seed multiple times
    await prisma.activityCategory.upsert({
      where: { name: category.name },
      update: {}, // do nothing if it already exists
      create: category,
    });
  }

  console.log("Default activity categories created!");
}