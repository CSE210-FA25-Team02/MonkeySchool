import { prisma } from "../lib/prisma.js";

const VALID_ROLES = ["PROFESSOR", "TA", "STUDENT", "TUTOR"];

/**
 * Assign or update a user's role in a class.
 */
export async function upsertClassRole({ userId, classId, role }) {
  const normalized = role.trim().toUpperCase();

  if (!VALID_ROLES.includes(normalized)) {
    throw new Error(
      `Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(", ")}`,
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
 */
export async function removeFromClass({ userId, classId }) {
  return prisma.classRole.delete({
    where: { user_class_unique: { userId, classId } },
  });
}

/**
 * Get roster for a class (sorted by role).
 */
export async function getRoster(classId) {
  return prisma.classRole.findMany({
    where: { classId },
    include: { user: true },
    orderBy: { role: "asc" },
  });
}
