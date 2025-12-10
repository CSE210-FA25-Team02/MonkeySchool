/**
 * Group Service
 *
 * Service functions for Group-related database operations.
 * Handles CRUD operations for groups, members, and supervisors.
 *
 * code/src/services/group.service.js
 */

import { prisma } from "../lib/prisma.js";

/**
 * Create a new group in a class
 * @param {Object} data - Group data
 * @param {string} data.name - Group name (required)
 * @param {string} data.classId - Class ID (required)
 * @param {string} [data.logoUrl] - Optional logo URL
 * @param {string} [data.mantra] - Optional group mantra
 * @param {string} [data.github] - Optional GitHub URL
 * @returns {Promise<Object>} Created group with relations
 */
export async function createGroup(data) {
  const { name, classId, logoUrl, mantra, github } = data;

  return prisma.group.create({
    data: {
      name,
      classId,
      logoUrl: logoUrl || null,
      mantra: mantra || null,
      github: github || null,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      supervisors: {
        include: {
          user: true,
        },
      },
      class: true,
    },
  });
}

/**
 * Get group by ID with all relations (members, supervisors, class)
 * @param {string} groupId - Group ID
 * @returns {Promise<Object|null>} Group with relations or null
 */
export async function getGroupById(groupId) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              preferredName: true,
              email: true,
              photoUrl: true,
              github: true,
            },
          },
        },
        orderBy: [{ role: "desc" }, { user: { name: "asc" } }],
      },
      supervisors: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              preferredName: true,
              email: true,
              photoUrl: true,
            },
          },
        },
      },
      class: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  preferredName: true,
                  email: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Update group details
 * @param {string} groupId - Group ID
 * @param {Object} data - Fields to update
 * @param {string} [data.name] - New group name
 * @param {string} [data.logoUrl] - New logo URL
 * @param {string} [data.mantra] - New mantra
 * @param {string} [data.github] - New GitHub URL
 * @returns {Promise<Object>} Updated group with relations
 */
export async function updateGroup(groupId, data) {
  const { name, logoUrl, mantra, github } = data;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
  if (mantra !== undefined) updateData.mantra = mantra;
  if (github !== undefined) updateData.github = github;

  return prisma.group.update({
    where: { id: groupId },
    data: updateData,
    include: {
      members: {
        include: {
          user: true,
        },
      },
      supervisors: {
        include: {
          user: true,
        },
      },
      class: true,
    },
  });
}

/**
 * Delete a group (cascades to members/supervisors via DB)
 * @param {string} groupId - Group ID
 * @returns {Promise<Object>} Deleted group
 */
export async function deleteGroup(groupId) {
  return prisma.group.delete({
    where: { id: groupId },
  });
}

/**
 * Add a member to a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID to add
 * @param {string} [role='MEMBER'] - Role ('LEADER' or 'MEMBER')
 * @returns {Promise<Object>} Created GroupRole record
 */
export async function addGroupMember(groupId, userId, role = "MEMBER") {
  const normalizedRole = role.toUpperCase();
  if (!["LEADER", "MEMBER"].includes(normalizedRole)) {
    throw new Error(`Invalid group role "${role}". Allowed: LEADER, MEMBER`);
  }

  return prisma.groupRole.create({
    data: {
      groupId,
      userId,
      role: normalizedRole,
    },
    include: {
      user: true,
      group: true,
    },
  });
}

/**
 * Remove a member from a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<Object>} Deleted GroupRole record
 */
export async function removeGroupMember(groupId, userId) {
  return prisma.groupRole.delete({
    where: {
      user_group_unique: {
        userId,
        groupId,
      },
    },
  });
}

/**
 * Update a member's role (LEADER <-> MEMBER)
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {string} newRole - New role ('LEADER' or 'MEMBER')
 * @returns {Promise<Object>} Updated GroupRole record
 */
export async function updateGroupMemberRole(groupId, userId, newRole) {
  const normalizedRole = newRole.toUpperCase();
  if (!["LEADER", "MEMBER"].includes(normalizedRole)) {
    throw new Error(`Invalid group role "${newRole}". Allowed: LEADER, MEMBER`);
  }

  return prisma.groupRole.update({
    where: {
      user_group_unique: {
        userId,
        groupId,
      },
    },
    data: {
      role: normalizedRole,
    },
    include: {
      user: true,
      group: true,
    },
  });
}

/**
 * Add a supervisor (TA) to a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID (must be a TA in the class)
 * @returns {Promise<Object>} Created GroupSupervisor record
 */
export async function addGroupSupervisor(groupId, userId) {
  return prisma.groupSupervisor.create({
    data: {
      groupId,
      userId,
    },
    include: {
      user: true,
      group: true,
    },
  });
}

/**
 * Remove a supervisor from a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID to remove as supervisor
 * @returns {Promise<Object>} Deleted GroupSupervisor record
 */
export async function removeGroupSupervisor(groupId, userId) {
  return prisma.groupSupervisor.delete({
    where: {
      user_group_supervisor_unique: {
        userId,
        groupId,
      },
    },
  });
}

/**
 * Get all groups for a class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} Array of groups with members and supervisors
 */
export async function getGroupsByClassId(classId) {
  return prisma.group.findMany({
    where: { classId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              preferredName: true,
              email: true,
              photoUrl: true,
              github: true,
            },
          },
        },
        orderBy: [{ role: "desc" }, { user: { name: "asc" } }],
      },
      supervisors: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              preferredName: true,
              email: true,
              photoUrl: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Get a user's group role in a specific group
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<Object|null>} GroupRole record or null
 */
export async function getGroupRole(userId, groupId) {
  return prisma.groupRole.findUnique({
    where: {
      user_group_unique: {
        userId,
        groupId,
      },
    },
    include: {
      user: true,
      group: {
        include: {
          class: true,
        },
      },
    },
  });
}

/**
 * Check if user is a supervisor of a group
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user is a supervisor
 */
export async function isGroupSupervisor(userId, groupId) {
  const supervisor = await prisma.groupSupervisor.findUnique({
    where: {
      user_group_supervisor_unique: {
        userId,
        groupId,
      },
    },
  });
  return !!supervisor;
}

/**
 * Get all students in a class (for member selection)
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} Array of students with user data
 */
export async function getStudentsInClass(classId) {
  return prisma.classRole.findMany({
    where: {
      classId,
      role: "STUDENT",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
          photoUrl: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });
}

/**
 * Get all TAs in a class (for supervisor selection)
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} Array of TAs with user data
 */
export async function getTAsInClass(classId) {
  return prisma.classRole.findMany({
    where: {
      classId,
      role: "TA",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
          photoUrl: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });
}

/**
 * Add multiple members to a group at once
 * @param {string} groupId - Group ID
 * @param {Array} members - Array of { userId, role } objects
 * @returns {Promise<number>} Count of members added
 */
export async function addGroupMembers(groupId, members) {
  const data = members.map((m) => ({
    groupId,
    userId: m.userId,
    role: (m.role || "MEMBER").toUpperCase(),
  }));

  const result = await prisma.groupRole.createMany({
    data,
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Remove all members from a group
 * @param {string} groupId - Group ID
 * @returns {Promise<number>} Count of members removed
 */
export async function removeAllGroupMembers(groupId) {
  const result = await prisma.groupRole.deleteMany({
    where: { groupId },
  });

  return result.count;
}

/**
 * Get students not in any group for a class
 * @param {string} classId - Class ID
 * @returns {Promise<Array>} Array of students without group membership
 */
export async function getStudentsWithoutGroup(classId) {
  // Get all students in the class
  const students = await prisma.classRole.findMany({
    where: {
      classId,
      role: "STUDENT",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
          photoUrl: true,
        },
      },
    },
  });

  // Get all groups in the class with their members
  const groups = await prisma.group.findMany({
    where: { classId },
    include: {
      members: {
        select: { userId: true },
      },
    },
  });

  // Get set of all user IDs in groups
  const usersInGroups = new Set();
  groups.forEach((group) => {
    group.members.forEach((member) => {
      usersInGroups.add(member.userId);
    });
  });

  // Filter students not in any group
  return students
    .filter((s) => !usersInGroups.has(s.userId))
    .map((s) => ({
      ...s.user,
      classRoleId: s.id,
    }));
}
