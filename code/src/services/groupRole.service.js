// Service functions for GroupRole-related database operations
// code/src/services/groupRole.service.js

import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../utils/api-error.js";

const VALID_ROLES = ["LEADER", "MEMBER"];

/**
 * Assign or update a user's role in a group
 */
export async function upsertGroupRole({ userId, groupId, role }) {
  const normalized = role.trim().toUpperCase();

  if (!VALID_ROLES.includes(normalized)) {
    throw new Error(`Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(", ")}`);
  }

  // Verify group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId }
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  return prisma.groupRole.upsert({
    where: { user_group_unique: { userId, groupId } },
    update: { role: normalized },
    create: { userId, groupId, role: normalized }
  });
}

/**
 * Remove a user from a group
 */
export async function removeFromGroup({ userId, groupId }) {
  return prisma.groupRole.delete({
    where: { user_group_unique: { userId, groupId } }
  });
}

/**
 * Get all members of a group
 */
export async function getGroupMembers(groupId) {
  return prisma.groupRole.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: [
      { role: "asc" }, // Leaders first
      { user: { name: "asc" } }
    ]
  });
}

/**
 * Assign multiple members to a group
 */
export async function assignMembersToGroup(groupId, memberIds, role = "MEMBER") {
  // Verify group exists
  const group = await prisma.group.findUnique({
    where: { id: groupId }
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Create group roles for each member
  const createPromises = memberIds.map(userId =>
    prisma.groupRole.upsert({
      where: { user_group_unique: { userId, groupId } },
      update: { role },
      create: { userId, groupId, role }
    })
  );

  await Promise.all(createPromises);

  return getGroupMembers(groupId);
}

/**
 * Remove multiple members from a group
 */
export async function removeMembersFromGroup(groupId, memberIds) {
  return prisma.groupRole.deleteMany({
    where: {
      groupId,
      userId: { in: memberIds }
    }
  });
}

