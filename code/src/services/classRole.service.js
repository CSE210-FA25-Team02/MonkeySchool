import { prisma } from "../lib/prisma.js";

const VALID_ROLES = ["PROFESSOR", "TA", "STUDENT", "TUTOR"];

/**
 * Assign or update a user's role in a class.
 * @param {Object} params Role assignment details
 * @param {string} params.userId User ID
 * @param {string} params.classId Class ID
 * @param {string} params.role Role to assign (PROFESSOR, TA, STUDENT, TUTOR)
 * @returns {Promise<Object>} ClassRole record after insert or update
 */
export async function upsertClassRole({ userId, classId, role }) {
  const normalized = role.trim().toUpperCase();

  if (!VALID_ROLES.includes(normalized)) {
    throw new Error(
      `Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(", ")}`
    );
  }

  return prisma.classRole.upsert({
    where: { user_class_unique: { userId, classId } },
    update: { role: normalized },
    create: { userId, classId, role: normalized },
  });
}

/**
 * Remove a user from a class.
 * @param {Object} params Removal details
 * @param {string} params.userId User ID
 * @param {string} params.classId Class ID
 * @returns {Promise<Object>} Deleted ClassRole record
 */
export async function removeFromClass({ userId, classId }) {
  return prisma.classRole.delete({
    where: { user_class_unique: { userId, classId } },
  });
}

/**
 * Get class role of user
 *
 * @param {string} userId - The ID of the user whose class role is being retrieved.
 * @param {string} classId - The ID of the class for which the user's role is being fetched.
 * @returns {Promise<Object|null>} The class role record, or null if it does not exist.
 */
export async function getClassRole(userId, classId) {
  return await prisma.classRole.findUnique({
    where: {
      user_class_unique: { userId, classId },
    },
    include: {
      user: true,
      class: true,
    },
  });
}

/**
 * Get roster for a class (sorted by role).
 * @param {string} classId Class ID
 * @returns {Promise<Array>} Array of ClassRole objects including user data
 */
export async function getRoster(classId) {
  return prisma.classRole.findMany({
    where: { classId },
    include: { user: true },
    orderBy: { role: "asc" },
  });
}
