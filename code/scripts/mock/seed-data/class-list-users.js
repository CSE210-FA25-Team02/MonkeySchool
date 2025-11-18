// code/scripts/mock/seed-data/users.js
import { prisma } from "../../../src/lib/prisma.js";

/**
 * Create professors and regular users
 * @returns {Promise<{professors: Array, users: Array}>}
 */
export async function createUsers() {
  console.log("Creating users...");

  const professors = await Promise.all([
    prisma.user.create({
      data: {
        email: "tpowell@ucsd.edu",
        name: "Prof. Powell",
        pronouns: "he/him",
        isProf: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "jsmith@ucsd.edu",
        name: "Prof. Smith",
        pronouns: "she/her",
        isProf: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "abs018@ucsd.edu",
        name: "Prof. Abhiraj",
        pronouns: "they/them",
        isProf: true,
      },
    }),
    // prisma.user.create({
    //   data: {
    //     email: "abs018@ucsd.edu",
    //     name: "Prof. Abhiraj",
    //     pronouns: "they/them",
    //   },
    // }),
  ]);

  const users = await Promise.all(
    Array.from({
      length: 20,
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

  console.log(
    `Created ${professors.length} professors and ${users.length} users`
  );
  return {
    professors,
    users,
  };
}
