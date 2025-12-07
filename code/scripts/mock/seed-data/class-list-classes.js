// code/scripts/mock/seed-data/classes.js
import { prisma } from "../../../src/lib/prisma.js";

/**
 * Class data definitions
 */
export const classesData = [
  { name: "CSE 210", quarter: "FA25" },
  { name: "CSE 110", quarter: "FA25" },
  { name: "CSE 100", quarter: "WI26" },
  {
    name: "Advanced Software Engineering and Project Management",
    quarter: "FA25",
  },
  { name: "Data Structures", quarter: "WI26" },
  { name: "CSE 141", quarter: "SP26" },
  { name: "Computer Architecture", quarter: "SP26" },
  { name: "Machine Learning Fundamentals", quarter: "FA25" },
  { name: "Web Development", quarter: "WI26" },
  { name: "CSE 230", quarter: "FA25" },
  { name: "Database Systems", quarter: "SP26" },
  { name: "Operating Systems Design and Implementation", quarter: "WI26" },
];

/**
 * Create classes from data definitions
 * @returns {Promise<Array>}
 */
export async function createClasses() {
  console.log("Creating classes...");

  const classes = await Promise.all(
    classesData.map(async (data) => {
      // Check if class already exists
      const existing = await prisma.class.findFirst({
        where: {
          name: data.name,
          quarter: data.quarter,
        },
      });

      if (existing) {
        return existing;
      }

      // Create if it doesn't exist
      return prisma.class.create({
        data: {
          name: data.name,
          quarter: data.quarter,
        },
      });
    })
  );

  console.log(`Created ${classes.length} classes`);
  return classes;
}
