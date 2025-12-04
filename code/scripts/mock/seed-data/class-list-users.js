// code/scripts/mock/seed-data/users.js
import { prisma } from "../../../src/lib/prisma.js";

/**
 * Create professors and regular users
 * @returns {Promise<{professors: Array, users: Array}>}
 */
export async function createUsers() {
  console.log("Creating users...");

  const professors = await Promise.all([
    prisma.user.upsert({
      where: { email: "tpowell@ucsd.edu" },
      update: {},
      create: {
        email: "tpowell@ucsd.edu",
        name: "Prof. Powell",
        pronouns: "he/him",
      },
    }),
    prisma.user.upsert({
      where: { email: "jsmith@ucsd.edu" },
      update: {},
      create: {
        email: "jsmith@ucsd.edu",
        name: "Prof. Smith",
        pronouns: "she/her",
      },
    }),
    prisma.user.upsert({
      where: { email: "mjohnson@ucsd.edu" },
      update: {},
      create: {
        email: "mjohnson@ucsd.edu",
        name: "Prof. Johnson",
        pronouns: "they/them",
      },
    }),
  ]);

  const users = await Promise.all(
    Array.from({
      length: 20,
    }).map((_, i) =>
      prisma.user.upsert({
        where: { email: `user${i + 1}@ucsd.edu` },
        update: {},
        create: {
          email: `user${i + 1}@ucsd.edu`,
          name: `User ${i + 1}`,
          pronouns: "they/them",
        },
      }),
    ),
  );

  console.log(
    `Created ${professors.length} professors and ${users.length} users`,
  );
  return {
    professors,
    users,
  };
}
