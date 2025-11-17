// Service functions for Class-related database operations
// code/src/services/class.service.js

import {
  prisma
} from "../lib/prisma.js";

/**
 * Generate a short, human-friendly class invite code.
 * @returns {string} Randomly generated 8-character invite code
 */
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({
      length: 8
    }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/**
 * Create a new class with auto-generated invite code.
 * @param {Object} params Class creation
 * @param {string} params.name Class name
 * @param {string} params.quarter Academic quarter (e.g., "FA24")
 * @returns {Promise<Object>} Created class record
 */
export async function createClass({
  name,
  quarter
}) {
  return prisma.class.create({
    data: {
      name,
      quarter,
      inviteCode: generateInviteCode()
    }
  });
}

/**
 * Retrieve a class with students and groups.
 * @param {string} id Class ID
 * @returns {Promise<Object>} Class object with members and groups
 */
export async function getClassById(id) {
  return prisma.class.findUnique({
    where: {
      id
    },
    include: {
      members: {
        include: {
          user: true
        }
      },
      groups: {
        include: {
          members: {
            include: {
              user: true
            }
          },
          supervisors: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });
}

/**
 * Retrieve a class by its invite code (used when a user joins).
 * @param {string} inviteCode Class invite code
 * @returns {Promise<Object>} Class object
 */
export async function getClassByInviteCode(inviteCode) {
  return prisma.class.findUnique({
    where: {
      inviteCode
    }
  });
}

/**
 * Update class (name, quarter, etc.)
 * @param {string} id Class ID
 * @param {Object} data Fields to update
 * @returns {Promise<Object>} Updated class record
 */
export async function updateClass(id, data) {
  return prisma.class.update({
    where: {
      id
    },
    data
  });
}

/**
 * Get all classes for a specific user (based on their ClassRole memberships).
 * Returns classes with user's role in each class.
 * @param {string} userId User ID
 * @returns {Promise<Array>} Array of class objects with role
 */
export async function getClassesByUserId(userId) {
  const classRoles = await prisma.classRole.findMany({
    where: {
      userId
    },
    include: {
      class: true
    }
  });

  return classRoles.map(cr => ({
    id: cr.class.id,
    name: cr.class.name,
    quarter: cr.class.quarter,
    inviteCode: cr.class.inviteCode,
    createdAt: cr.class.createdAt,
    role: cr.role
  }));
}

/**
 * Delete a class by ID.
 * Note: Deleting class will also delete ClassRole + Group + GroupRole via cascades if configured.
 * @param {string} id Class ID
 * @returns {Promise<Object>} Deleted class record
 */
export async function deleteClass(id) {
  return prisma.class.delete({
    where: {
      id
    }
  });
}