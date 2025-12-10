/**
 * Group Permissions Helper
 *
 * Permission checking functions for group management operations.
 * Determines what actions users can perform based on their roles.
 *
 * Authorization Rules:
 * - Professors/TAs: Full access (create, edit all fields, manage members, delete)
 * - Group Leaders: Can edit name, logoUrl, mantra, github ONLY
 * - Students: View only
 *
 * code/src/utils/group-permissions.js
 */

import { prisma } from "../lib/prisma.js";

/**
 * Get user's class role for a given class
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object|null>} ClassRole record or null
 */
async function getClassRole(userId, classId) {
  return prisma.classRole.findUnique({
    where: {
      user_class_unique: { userId, classId },
    },
  });
}

/**
 * Get user's group role for a given group
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<Object|null>} GroupRole record or null
 */
async function getGroupRole(userId, groupId) {
  return prisma.groupRole.findUnique({
    where: {
      user_group_unique: { userId, groupId },
    },
  });
}

/**
 * Get group with its class information
 * @param {string} groupId - Group ID
 * @returns {Promise<Object|null>} Group with class or null
 */
async function getGroupWithClass(groupId) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: { class: true },
  });
}

/**
 * Check if user can manage groups in a class (create groups, etc.)
 * Only Professors and TAs can create/manage groups
 *
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<boolean>} True if user can manage groups
 */
export async function canManageGroups(userId, classId) {
  const classRole = await getClassRole(userId, classId);
  if (!classRole) return false;

  return ["PROFESSOR", "TA"].includes(classRole.role);
}

/**
 * Check if user can edit group details (name, logo, mantra, github)
 * - Professors and TAs can edit any group in their class
 * - Group Leaders can edit their own group's basic details
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user can edit group details
 */
export async function canEditGroup(userId, groupId) {
  const group = await getGroupWithClass(groupId);
  if (!group) return false;

  // Check class role first (Prof/TA have full access)
  const classRole = await getClassRole(userId, group.classId);
  if (classRole && ["PROFESSOR", "TA"].includes(classRole.role)) {
    return true;
  }

  // Check if user is a group leader
  const groupRole = await getGroupRole(userId, groupId);
  if (groupRole && groupRole.role === "LEADER") {
    return true;
  }

  return false;
}

/**
 * Check if user can edit group members (add/remove members, change roles)
 * Professors, TAs, and Group Leaders can modify group membership
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user can edit group members
 */
export async function canEditGroupMembers(userId, groupId) {
  const group = await getGroupWithClass(groupId);
  if (!group) return false;

  const classRole = await getClassRole(userId, group.classId);
  if (!classRole) return false;

  // Professors and TAs can always edit members
  if (["PROFESSOR", "TA"].includes(classRole.role)) {
    return true;
  }

  // Group leaders can edit members of their own group
  return await isGroupLeader(userId, groupId);
}

/**
 * Check if user can delete a group
 * Only Professors and TAs can delete groups
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user can delete group
 */
export async function canDeleteGroup(userId, groupId) {
  const group = await getGroupWithClass(groupId);
  if (!group) return false;

  const classRole = await getClassRole(userId, group.classId);
  if (!classRole) return false;

  return ["PROFESSOR", "TA"].includes(classRole.role);
}

/**
 * Check if user can manage supervisors for a group
 * Only Professors can assign/remove supervisors
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user can manage supervisors
 */
export async function canManageSupervisors(userId, groupId) {
  const group = await getGroupWithClass(groupId);
  if (!group) return false;

  const classRole = await getClassRole(userId, group.classId);
  if (!classRole) return false;

  // Only professors can manage supervisors
  return classRole.role === "PROFESSOR";
}

/**
 * Check if user is a leader of the specified group
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user is a group leader
 */
export async function isGroupLeader(userId, groupId) {
  const groupRole = await getGroupRole(userId, groupId);
  return groupRole?.role === "LEADER";
}

/**
 * Check if user is a member (any role) of the specified group
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True if user is a group member
 */
export async function isGroupMember(userId, groupId) {
  const groupRole = await getGroupRole(userId, groupId);
  return !!groupRole;
}

/**
 * Get user's permission level for a group
 * Returns an object with all permission flags
 *
 * @param {string} userId - User ID
 * @param {string} groupId - Group ID
 * @returns {Promise<Object>} Permission flags object
 */
export async function getGroupPermissions(userId, groupId) {
  const group = await getGroupWithClass(groupId);
  if (!group) {
    return {
      canView: false,
      canEdit: false,
      canEditMembers: false,
      canDelete: false,
      canManageSupervisors: false,
      isLeader: false,
      isMember: false,
      isProf: false,
      isTA: false,
    };
  }

  const classRole = await getClassRole(userId, group.classId);
  const groupRole = await getGroupRole(userId, groupId);

  const isProf = classRole?.role === "PROFESSOR";
  const isTA = classRole?.role === "TA";
  const isLeader = groupRole?.role === "LEADER";
  const isMember = !!groupRole;

  return {
    canView: !!classRole, // Any class member can view
    canEdit: isProf || isTA || isLeader,
    canEditMembers: isProf || isTA,
    canDelete: isProf || isTA,
    canManageSupervisors: isProf,
    isLeader,
    isMember,
    isProf,
    isTA,
  };
}

/**
 * Get user's role type in relation to a class
 * @param {string} userId - User ID
 * @param {string} classId - Class ID
 * @returns {Promise<Object>} Role type flags
 */
export async function getUserClassRoleType(userId, classId) {
  const classRole = await getClassRole(userId, classId);

  return {
    isProf: classRole?.role === "PROFESSOR",
    isTA: classRole?.role === "TA",
    isTutor: classRole?.role === "TUTOR",
    isStudent: classRole?.role === "STUDENT",
    isMember: !!classRole,
    role: classRole?.role || null,
  };
}
