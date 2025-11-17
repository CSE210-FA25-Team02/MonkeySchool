// Service functions for User-related database operations
// code/src/services/user.service.js

import { prisma } from "../lib/prisma.js";

/**
 * Create a new user record.
 * @param {Object} data User data (email, name, photoUrl, etc.)
 * @returns {Promise<Object>} Created user object
 */
export async function createUser(data) {
  return prisma.user.create({ data });
}

/**
 * Get a user by ID, including their class and group relationships.
 * @param {string} id User ID
 * @returns {Promise<Object|null>} User object with relationships, or null
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
 * @param {string} email User email address
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Update user profile fields.
 * @param {string} id User ID
 * @param {Object} data Fields to update
 * @returns {Promise<Object>} Updated user object
 */
export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data
  });
}

/**
 * Delete a user and all their relationships
 * @param {string} id User ID
 * @returns {Promise<Object>} Deleted user object
 */
export async function deleteUser(id) {
  await prisma.classRole.deleteMany({ where: { userId: id } });
  await prisma.groupRole.deleteMany({ where: { userId: id } });
  await prisma.groupSupervisor.deleteMany({ where: { userId: id } });

  return prisma.user.delete({
    where: { id }
  });
}