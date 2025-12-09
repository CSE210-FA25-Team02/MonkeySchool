/**
 * ============================================================================
 * Group Controller
 * ============================================================================
 *
 * File: code/src/controllers/group.controller.js
 *
 * This controller handles all group-related routes including:
 * - CRUD operations for groups
 * - Member management (add/remove/update roles)
 * - Supervisor management
 * - Rendering modals for group management
 *
 * Authorization:
 * - Professors/TAs: Full access (create, edit all, manage members, delete)
 * - Group Leaders: Can edit name, logoUrl, mantra, github only
 * - Students: View only
 *
 * ============================================================================
 */

import * as groupService from "../services/group.service.js";
import * as classService from "../services/class.service.js";
import {
  canManageGroups,
  canEditGroup,
  canEditGroupMembers,
  canDeleteGroup,
  canManageSupervisors,
  getGroupPermissions,
  getUserClassRoleType,
} from "../utils/group-permissions.js";
import {
  renderCreateGroupModal,
  renderEditGroupModal,
  renderDeleteGroupConfirmation,
  renderGroupManagementModal,
  renderGroupSuccess,
  renderGroupError,
} from "../utils/htmx-templates/group-templates.js";
import { renderClassDirectory } from "../utils/htmx-templates/classes-templates.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../utils/api-error.js";

// ============================================================================
// GROUP CRUD OPERATIONS
// ============================================================================

/**
 * Create a new group
 * Route: POST /groups
 * Auth: requireAuth (must be PROFESSOR or TA)
 */
export const createGroup = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    classId,
    logoUrl,
    mantra,
    github,
    members,
    leaders,
    supervisors,
  } = req.body;

  // Validate required fields
  if (!name || !name.trim()) {
    throw new BadRequestError("Group name is required");
  }
  if (!classId) {
    throw new BadRequestError("Class ID is required");
  }

  // Check permissions
  const canManage = await canManageGroups(userId, classId);
  if (!canManage) {
    throw new ForbiddenError("Only professors and TAs can create groups");
  }

  // Create the group
  const group = await groupService.createGroup({
    name: name.trim(),
    classId,
    logoUrl: logoUrl || null,
    mantra: mantra || null,
    github: github || null,
  });

  // Add members if provided
  if (members && Array.isArray(members) && members.length > 0) {
    // Parse leaders
    const leaderIds = new Set(leaders || []);

    for (const memberId of members) {
      const role = leaderIds.has(memberId) ? "LEADER" : "MEMBER";
      try {
        await groupService.addGroupMember(group.id, memberId, role);
      } catch (err) {
        console.error(`Failed to add member ${memberId}:`, err.message);
      }
    }
  }

  // Add supervisors if provided
  if (supervisors && Array.isArray(supervisors) && supervisors.length > 0) {
    for (const supervisorId of supervisors) {
      try {
        await groupService.addGroupSupervisor(group.id, supervisorId);
      } catch (err) {
        console.error(`Failed to add supervisor ${supervisorId}:`, err.message);
      }
    }
  }

  // Return response
  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Refresh the directory
    const directory = await classService.getClassDirectory(classId);
    const html = renderClassDirectory(directory, req.user);
    res.status(201).send(html);
  } else {
    const createdGroup = await groupService.getGroupById(group.id);
    res.status(201).json(createdGroup);
  }
});

/**
 * Get group details
 * Route: GET /groups/:groupId
 * Auth: requireAuth
 */
export const getGroupDetail = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check if user has access to this class
  const permissions = await getGroupPermissions(userId, groupId);
  if (!permissions.canView) {
    throw new ForbiddenError("You do not have access to this group");
  }

  res.json({
    ...group,
    permissions,
  });
});

/**
 * Update group details
 * Route: PUT /groups/:groupId
 * Auth: requireAuth (must be PROFESSOR, TA, or Group Leader)
 */
export const updateGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { name, logoUrl, mantra, github } = req.body;

  // Check if group exists
  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const canEdit = await canEditGroup(userId, groupId);
  if (!canEdit) {
    throw new ForbiddenError("You do not have permission to edit this group");
  }

  // Validate name if provided
  if (name !== undefined && (!name || !name.trim())) {
    throw new BadRequestError("Group name cannot be empty");
  }

  // Update group
  const updatedGroup = await groupService.updateGroup(groupId, {
    name: name?.trim(),
    logoUrl,
    mantra,
    github,
  });

  // Return response
  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Refresh the directory
    const directory = await classService.getClassDirectory(group.classId);
    const html = renderClassDirectory(directory, req.user);
    res.send(html);
  } else {
    res.json(updatedGroup);
  }
});

/**
 * Delete a group
 * Route: DELETE /groups/:groupId
 * Auth: requireAuth (must be PROFESSOR or TA)
 */
export const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Check if group exists
  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const canDelete = await canDeleteGroup(userId, groupId);
  if (!canDelete) {
    throw new ForbiddenError("Only professors and TAs can delete groups");
  }

  const classId = group.classId;

  // Delete the group
  await groupService.deleteGroup(groupId);

  // Return response
  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Refresh the directory
    const directory = await classService.getClassDirectory(classId);
    const html = renderClassDirectory(directory, req.user);
    res.send(html);
  } else {
    res.status(204).send();
  }
});

// ============================================================================
// MEMBER MANAGEMENT
// ============================================================================

/**
 * Add a member to a group
 * Route: POST /groups/:groupId/members
 * Auth: requireAuth (must be PROFESSOR or TA)
 */
export const addMember = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { userId: memberUserId, role } = req.body;

  if (!memberUserId) {
    throw new BadRequestError("User ID is required");
  }

  // Check if group exists
  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const canEditMembers = await canEditGroupMembers(userId, groupId);
  if (!canEditMembers) {
    throw new ForbiddenError(
      "Only professors and TAs can manage group members"
    );
  }

  // Add member
  try {
    await groupService.addGroupMember(groupId, memberUserId, role || "MEMBER");
  } catch (err) {
    if (err.code === "P2002") {
      throw new BadRequestError("User is already a member of this group");
    }
    throw err;
  }

  // Return response
  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Refresh the management modal
    const updatedGroup = await groupService.getGroupById(groupId);
    const students = await groupService.getStudentsInClass(group.classId);
    const tas = await groupService.getTAsInClass(group.classId);
    const permissions = await getGroupPermissions(userId, groupId);

    const html = renderGroupManagementModal(
      updatedGroup,
      students,
      tas,
      permissions
    );
    res.send(html);
  } else {
    const updatedGroup = await groupService.getGroupById(groupId);
    res.status(201).json(updatedGroup);
  }
});

/**
 * Remove a member from a group
 * Route: DELETE /groups/:groupId/members/:userId
 * Auth: requireAuth (must be PROFESSOR or TA)
 */
export const removeMember = asyncHandler(async (req, res) => {
  const { groupId, userId: memberUserId } = req.params;
  const userId = req.user.id;

  // Check if group exists
  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const canEditMembers = await canEditGroupMembers(userId, groupId);
  if (!canEditMembers) {
    throw new ForbiddenError(
      "Only professors and TAs can manage group members"
    );
  }

  // Remove member
  try {
    await groupService.removeGroupMember(groupId, memberUserId);
  } catch (err) {
    if (err.code === "P2025") {
      throw new NotFoundError("Member not found in this group");
    }
    throw err;
  }

  // Return response
  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Refresh the management modal
    const updatedGroup = await groupService.getGroupById(groupId);
    const students = await groupService.getStudentsInClass(group.classId);
    const tas = await groupService.getTAsInClass(group.classId);
    const permissions = await getGroupPermissions(userId, groupId);

    const html = renderGroupManagementModal(
      updatedGroup,
      students,
      tas,
      permissions
    );
    res.send(html);
  } else {
    res.status(204).send();
  }
});

/**
 * Update a member's role
 * Route: PUT /groups/:groupId/members/:userId/role
 * Auth: requireAuth (must be PROFESSOR or TA)
 */
export const updateMemberRole = asyncHandler(async (req, res) => {
  const { groupId, userId: memberUserId } = req.params;
  const userId = req.user.id;
  const { role } = req.body;

  if (!role) {
    throw new BadRequestError("Role is required");
  }

  // Check if group exists
  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const canEditMembers = await canEditGroupMembers(userId, groupId);
  if (!canEditMembers) {
    throw new ForbiddenError(
      "Only professors and TAs can manage group members"
    );
  }

  // Update role
  try {
    await groupService.updateGroupMemberRole(groupId, memberUserId, role);
  } catch (err) {
    if (err.code === "P2025") {
      throw new NotFoundError("Member not found in this group");
    }
    throw err;
  }

  // Return response
  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Refresh the management modal
    const updatedGroup = await groupService.getGroupById(groupId);
    const students = await groupService.getStudentsInClass(group.classId);
    const tas = await groupService.getTAsInClass(group.classId);
    const permissions = await getGroupPermissions(userId, groupId);

    const html = renderGroupManagementModal(
      updatedGroup,
      students,
      tas,
      permissions
    );
    res.send(html);
  } else {
    const updatedGroup = await groupService.getGroupById(groupId);
    res.json(updatedGroup);
  }
});

// ============================================================================
// SUPERVISOR MANAGEMENT
// ============================================================================

/**
 * Add a supervisor to a group
 * Route: POST /groups/:groupId/supervisors
 * Auth: requireAuth (must be PROFESSOR)
 */
export const addSupervisor = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const { userId: supervisorUserId } = req.body;

  if (!supervisorUserId) {
    throw new BadRequestError("User ID is required");
  }

  // Check if group exists
  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions (only professors can manage supervisors)
  const canManage = await canManageSupervisors(userId, groupId);
  if (!canManage) {
    throw new ForbiddenError("Only professors can manage group supervisors");
  }

  // Add supervisor
  try {
    await groupService.addGroupSupervisor(groupId, supervisorUserId);
  } catch (err) {
    if (err.code === "P2002") {
      throw new BadRequestError("User is already a supervisor of this group");
    }
    throw err;
  }

  // Return response
  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Refresh the management modal
    const updatedGroup = await groupService.getGroupById(groupId);
    const students = await groupService.getStudentsInClass(group.classId);
    const tas = await groupService.getTAsInClass(group.classId);
    const permissions = await getGroupPermissions(userId, groupId);

    const html = renderGroupManagementModal(
      updatedGroup,
      students,
      tas,
      permissions
    );
    res.send(html);
  } else {
    const updatedGroup = await groupService.getGroupById(groupId);
    res.status(201).json(updatedGroup);
  }
});

/**
 * Remove a supervisor from a group
 * Route: DELETE /groups/:groupId/supervisors/:userId
 * Auth: requireAuth (must be PROFESSOR)
 */
export const removeSupervisor = asyncHandler(async (req, res) => {
  const { groupId, userId: supervisorUserId } = req.params;
  const userId = req.user.id;

  // Check if group exists
  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions (only professors can manage supervisors)
  const canManage = await canManageSupervisors(userId, groupId);
  if (!canManage) {
    throw new ForbiddenError("Only professors can manage group supervisors");
  }

  // Remove supervisor
  try {
    await groupService.removeGroupSupervisor(groupId, supervisorUserId);
  } catch (err) {
    if (err.code === "P2025") {
      throw new NotFoundError("Supervisor not found for this group");
    }
    throw err;
  }

  // Return response
  const isHtmx = !!req.headers["hx-request"];
  if (isHtmx) {
    // Refresh the management modal
    const updatedGroup = await groupService.getGroupById(groupId);
    const students = await groupService.getStudentsInClass(group.classId);
    const tas = await groupService.getTAsInClass(group.classId);
    const permissions = await getGroupPermissions(userId, groupId);

    const html = renderGroupManagementModal(
      updatedGroup,
      students,
      tas,
      permissions
    );
    res.send(html);
  } else {
    res.status(204).send();
  }
});

// ============================================================================
// UI MODALS
// ============================================================================

/**
 * Get Edit Group Modal
 * Route: GET /groups/:groupId/edit-modal
 * Auth: requireAuth
 */
export const getEditGroupModal = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const permissions = await getGroupPermissions(userId, groupId);
  if (!permissions.canEdit) {
    throw new ForbiddenError("You do not have permission to edit this group");
  }

  // Get class members for potential member selection
  const students = await groupService.getStudentsInClass(group.classId);
  const tas = await groupService.getTAsInClass(group.classId);

  const html = renderEditGroupModal(group, permissions, students, tas);
  res.send(html);
});

/**
 * Get Delete Group Confirmation Modal
 * Route: GET /groups/:groupId/delete-modal
 * Auth: requireAuth
 */
export const getDeleteGroupModal = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const canDelete = await canDeleteGroup(userId, groupId);
  if (!canDelete) {
    throw new ForbiddenError("Only professors and TAs can delete groups");
  }

  const html = renderDeleteGroupConfirmation(group);
  res.send(html);
});

/**
 * Get Group Management Modal
 * Route: GET /groups/:groupId/manage
 * Auth: requireAuth (must be PROFESSOR or TA)
 */
export const getGroupManagementModal = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const group = await groupService.getGroupById(groupId);
  if (!group) {
    throw new NotFoundError("Group not found");
  }

  // Check permissions
  const permissions = await getGroupPermissions(userId, groupId);
  if (!permissions.canEditMembers) {
    throw new ForbiddenError(
      "Only professors and TAs can manage group members"
    );
  }

  // Get class members for selection
  const students = await groupService.getStudentsInClass(group.classId);
  const tas = await groupService.getTAsInClass(group.classId);

  const html = renderGroupManagementModal(group, students, tas, permissions);
  res.send(html);
});

/**
 * Get Create Group Modal
 * Route: GET /classes/:classId/groups/create-modal
 * Auth: requireAuth (must be PROFESSOR or TA)
 */
export const getCreateGroupModal = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id;

  // Check permissions
  const canManage = await canManageGroups(userId, classId);
  if (!canManage) {
    throw new ForbiddenError("Only professors and TAs can create groups");
  }

  // Get students and TAs for selection
  const students = await groupService.getStudentsInClass(classId);
  const tas = await groupService.getTAsInClass(classId);

  const html = renderCreateGroupModal(classId, students, tas);
  res.send(html);
});

/**
 * Get all groups for a class (JSON API)
 * Route: GET /classes/:classId/groups
 * Auth: requireAuth
 */
export const getGroupsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id;

  // Check if user is a member of this class
  const roleType = await getUserClassRoleType(userId, classId);
  if (!roleType.isMember) {
    throw new ForbiddenError("You are not a member of this class");
  }

  const groups = await groupService.getGroupsByClassId(classId);
  res.json(groups);
});
