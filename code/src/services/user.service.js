// Service functions for User-related database operations
// code/src/services/user.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Create a new user record.
 */
export async function createUser(data) {
  return prisma.user.create({ data });
}

/**
 * Get a user by ID, including their class and group relationships.
 */
export async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      classRoles: { include: { class: true } },
      groupRoles: { include: { group: true } },
      groupSupervises: { include: { group: true } }
    }
  });
}

/**
 * Get a user by email (used in OAuth login flow).
 */
export async function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Update user profile fields.
 */
export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data
  });
}

export async function deleteUser(id) {
  await prisma.classRole.deleteMany({ where: { userId: id } });
  await prisma.groupRole.deleteMany({ where: { userId: id } });
  await prisma.groupSupervisor.deleteMany({ where: { userId: id } });

  return prisma.user.delete({
    where: { id }
  });
}


