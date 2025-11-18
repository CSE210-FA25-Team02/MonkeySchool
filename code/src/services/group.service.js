// Service functions for Group-related database operations
// code/src/services/group.service.js

import { prisma } from "../lib/prisma.js";
import { NotFoundError, ForbiddenError } from "../utils/api-error.js";

/**
 * Create a new group
 */
export async function createGroup({
  name,
  description,
  notes,
  classId,
  createdById,
  leaderId,
  memberIds = [],
}) {
  // Validate that class exists
  const klass = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!klass) {
    throw new NotFoundError("Class not found");
  }

  // Create group with members
  const group = await prisma.group.create({
    data: {
      name,
      description,
      notes,
      classId,
      createdById,
      leaderId,
      members: {
        create: [
          // Add leader as LEADER role if specified
          ...(leaderId ? [{ userId: leaderId, role: "LEADER" }] : []),
          // Add other members as MEMBER role
          ...memberIds
            .filter((id) => id !== leaderId) // Don't add leader twice
            .map((userId) => ({ userId, role: "MEMBER" })),
        ],
      },
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
      leader: true,
      createdBy: true,
      class: true,
    },
  });

  return group;
}

/**
 * Get group by ID with all related data
 */
export async function getGroupById(id) {
  const group = await prisma.group.findUnique({
    where: { id },
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
      leader: true,
      createdBy: true,
      class: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  return group;
}

/**
 * Get all groups for a specific class
 */
export async function getGroupsByClassId(classId) {
  return prisma.group.findMany({
    where: { classId },
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
      leader: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get groups for a specific user (where they are a member or leader)
 */
export async function getGroupsByUserId(userId) {
  const groupRoles = await prisma.groupRole.findMany({
    where: { userId },
    include: {
      group: {
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
          leader: true,
          createdBy: true,
          class: true,
        },
      },
    },
  });

  return groupRoles.map((gr) => ({
    ...gr.group,
    userRole: gr.role,
  }));
}

/**
 * Update group details (name, description, notes)
 * Only updates fields that are provided
 */
export async function updateGroup(id, data, userId, userRole) {
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: true,
      supervisors: true,
    },
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const isSupervisor = group.supervisors.some((gs) => gs.userId === userId);
  const isLeader = group.leaderId === userId;
  const isMember = group.members.some(
    (m) => m.userId === userId && m.role === "LEADER"
  );

  // TAs (supervisors) can update everything
  if (!isSupervisor) {
    // Team Leaders can only update name, description, and notes (not members)
    if (isLeader || isMember) {
      // Remove member-related fields from update data
      const { memberIds, leaderId, ...allowedFields } = data;
      data = allowedFields;
    } else {
      throw new ForbiddenError(
        "You do not have permission to update this group"
      );
    }
  }

  // Update group
  const updated = await prisma.group.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      notes: data.notes,
      leaderId: isSupervisor ? data.leaderId : group.leaderId, // Only TAs can change leader
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.mantra !== undefined && { mantra: data.mantra }),
      ...(data.github !== undefined && { github: data.github }),
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
      leader: true,
      createdBy: true,
      class: true,
    },
  });

  return updated;
}

/**
 * Delete a group
 */
export async function deleteGroup(id) {
  const group = await prisma.group.findUnique({
    where: { id },
  });

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  return prisma.group.delete({
    where: { id },
  });
}

/**
 * Check if user is a TA (supervisor) for a group
 */
export async function isGroupSupervisor(groupId, userId) {
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
 * Check if user is a TA or PROFESSOR in the class containing this group
 */
export async function isClassTAOrProfessor(groupId, userId) {
  if (!groupId) {
    return false;
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      class: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!group) {
    return false;
  }

  const classRole = group.class.members.find(
    (cr) =>
      cr.userId === userId && (cr.role === "TA" || cr.role === "PROFESSOR")
  );

  return !!classRole;
}
