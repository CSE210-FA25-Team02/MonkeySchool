// Group Controller
// code/src/controllers/group.controller.js

import * as groupService from "../services/group.service.js";
import * as groupRoleService from "../services/groupRole.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { NotFoundError, ForbiddenError } from "../utils/api-error.js";
import {
  renderGroupsList,
  renderGroupDetail,
  renderGroupForm,
  renderTAGroupsDashboard,
} from "../utils/htmx-templates/groups-templates.js";
import { createBaseLayout } from "../utils/html-templates.js";

/**
 * Create a new group (TA only)
 */
export const createGroup = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    notes,
    classId,
    leaderId,
    memberIds = [],
  } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Validate input
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Group name is required" });
  }

  if (!classId) {
    return res.status(400).json({ error: "Class ID is required" });
  }

  // Check if user is TA or PROFESSOR in the class
  const isTA = await groupService.isClassTAOrProfessor(null, userId);
  // We need to check class membership directly
  const { prisma } = await import("../lib/prisma.js");
  const classRole = await prisma.classRole.findFirst({
    where: {
      userId,
      classId,
      role: { in: ["TA", "PROFESSOR"] },
    },
  });

  if (!classRole) {
    return res
      .status(403)
      .json({ error: "Only TAs and Professors can create groups" });
  }

  // Create group
  const group = await groupService.createGroup({
    name,
    description,
    notes,
    classId,
    createdById: userId,
    leaderId,
    memberIds,
  });

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    // Redirect to group detail page
    res.redirect(`/api/groups/${group.id}`);
  } else {
    res.status(201).json(group);
  }
});

/**
 * Get group by ID
 */
export const getGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const group = await groupService.getGroupById(id);

  // Check if user has access (member, leader, supervisor, or TA/PROFESSOR in class)
  const isMember = group.members.some((m) => m.userId === userId);
  const isSupervisor = group.supervisors.some((s) => s.userId === userId);
  const isClassTA = await groupService.isClassTAOrProfessor(id, userId);

  if (!isMember && !isSupervisor && !isClassTA) {
    return res
      .status(403)
      .json({ error: "You do not have access to this group" });
  }

  res.json(group);
});

/**
 * Get all groups for a class (TA/Professor only)
 */
export const getGroupsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check if user is TA or PROFESSOR in the class
  const { prisma } = await import("../lib/prisma.js");
  const classRole = await prisma.classRole.findFirst({
    where: {
      userId,
      classId,
      role: { in: ["TA", "PROFESSOR"] },
    },
  });

  if (!classRole) {
    return res
      .status(403)
      .json({
        error: "Only TAs and Professors can view all groups in a class",
      });
  }

  const groups = await groupService.getGroupsByClassId(classId);
  res.json(groups);
});

/**
 * Get groups for the current user (Student view)
 */
export const getUserGroups = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const groups = await groupService.getGroupsByUserId(userId);
  res.json(groups);
});

/**
 * Update group (TA or Team Leader)
 */
export const updateGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { name, description, notes, leaderId, memberIds } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const group = await groupService.getGroupById(id);

  // Determine user's role
  const isSupervisor = group.supervisors.some((s) => s.userId === userId);
  const isLeader = group.leaderId === userId;
  const isClassTA = await groupService.isClassTAOrProfessor(id, userId);

  // Only TAs (supervisors or class TAs) can update members
  if (memberIds !== undefined && !isSupervisor && !isClassTA) {
    return res.status(403).json({ error: "Only TAs can update group members" });
  }

  // Only TAs can change leader
  if (
    leaderId !== undefined &&
    leaderId !== group.leaderId &&
    !isSupervisor &&
    !isClassTA
  ) {
    return res
      .status(403)
      .json({ error: "Only TAs can change the group leader" });
  }

  // Update group
  const updated = await groupService.updateGroup(
    id,
    req.body,
    userId,
    isSupervisor ? "TA" : isLeader ? "LEADER" : "MEMBER"
  );

  // Update members if provided and user is TA
  if (memberIds !== undefined && (isSupervisor || isClassTA)) {
    // Get current members
    const currentMembers = group.members.map((m) => m.userId);

    // Members to add
    const toAdd = memberIds.filter((id) => !currentMembers.includes(id));
    // Members to remove
    const toRemove = currentMembers.filter((id) => !memberIds.includes(id));

    if (toAdd.length > 0) {
      await groupRoleService.assignMembersToGroup(id, toAdd, "MEMBER");
    }

    if (toRemove.length > 0) {
      await groupRoleService.removeMembersFromGroup(id, toRemove);
    }
  }

  const finalGroup = await groupService.getGroupById(id);

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    // Redirect to group detail page
    res.redirect(`/api/groups/${id}`);
  } else {
    res.json(finalGroup);
  }
});

/**
 * Delete group (TA only)
 */
export const deleteGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const group = await groupService.getGroupById(id);

  // Check if user is TA or PROFESSOR in the class
  const isSupervisor = group.supervisors.some((s) => s.userId === userId);
  const isClassTA = await groupService.isClassTAOrProfessor(id, userId);

  if (!isSupervisor && !isClassTA) {
    return res
      .status(403)
      .json({ error: "Only TAs and Professors can delete groups" });
  }

  await groupService.deleteGroup(id);
  res.status(204).send();
});

/**
 * Assign members to a group (TA only)
 */
export const assignMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { memberIds, role = "MEMBER" } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const group = await groupService.getGroupById(id);

  // Check if user is TA or PROFESSOR in the class
  const isSupervisor = group.supervisors.some((s) => s.userId === userId);
  const isClassTA = await groupService.isClassTAOrProfessor(id, userId);

  if (!isSupervisor && !isClassTA) {
    return res
      .status(403)
      .json({ error: "Only TAs and Professors can assign members" });
  }

  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return res
      .status(400)
      .json({ error: "memberIds must be a non-empty array" });
  }

  const members = await groupRoleService.assignMembersToGroup(
    id,
    memberIds,
    role
  );
  res.json(members);
});

/**
 * Remove members from a group (TA only)
 */
export const removeMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { memberIds } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const group = await groupService.getGroupById(id);

  // Check if user is TA or PROFESSOR in the class
  const isSupervisor = group.supervisors.some((s) => s.userId === userId);
  const isClassTA = await groupService.isClassTAOrProfessor(id, userId);

  if (!isSupervisor && !isClassTA) {
    return res
      .status(403)
      .json({ error: "Only TAs and Professors can remove members" });
  }

  if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
    return res
      .status(400)
      .json({ error: "memberIds must be a non-empty array" });
  }

  await groupRoleService.removeMembersFromGroup(id, memberIds);
  res.status(204).send();
});

/**
 * Get group members
 */
export const getGroupMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const group = await groupService.getGroupById(id);

  // Check if user has access
  const isMember = group.members.some((m) => m.userId === userId);
  const isSupervisor = group.supervisors.some((s) => s.userId === userId);
  const isClassTA = await groupService.isClassTAOrProfessor(id, userId);

  if (!isMember && !isSupervisor && !isClassTA) {
    return res
      .status(403)
      .json({ error: "You do not have access to this group" });
  }

  const members = await groupRoleService.getGroupMembers(id);
  res.json(members);
});

/**
 * Render groups list page for current user (HTML)
 */
export const renderUserGroups = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .send(createBaseLayout("Groups", "<p>Authentication required</p>"));
  }

  const groups = await groupService.getGroupsByUserId(userId);
  const content = renderGroupsList(groups, req.user);

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    res.send(content);
  } else {
    res.send(createBaseLayout("My Groups", content));
  }
});

/**
 * Render group detail page (HTML)
 */
export const renderGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .send(createBaseLayout("Group", "<p>Authentication required</p>"));
  }

  try {
    const group = await groupService.getGroupById(id);

    // Check access
    const isMember = group.members.some((m) => m.userId === userId);
    const isSupervisor = group.supervisors.some((s) => s.userId === userId);
    const isClassTA = await groupService.isClassTAOrProfessor(id, userId);

    if (!isMember && !isSupervisor && !isClassTA) {
      return res
        .status(403)
        .send(
          createBaseLayout(
            "Group",
            "<p>You do not have access to this group</p>"
          )
        );
    }

    const content = renderGroupDetail(group, req.user);

    const isHtmxRequest = req.headers["hx-request"];
    if (isHtmxRequest) {
      res.send(content);
    } else {
      res.send(createBaseLayout("Group Details", content));
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res
        .status(404)
        .send(createBaseLayout("Group Not Found", "<p>Group not found</p>"));
    }
    throw error;
  }
});

/**
 * Render group editor (HTML)
 */
export const renderGroupEditor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { classId } = req.query;

  if (!userId) {
    return res
      .status(401)
      .send(createBaseLayout("Edit Group", "<p>Authentication required</p>"));
  }

  let group = null;
  if (id) {
    try {
      group = await groupService.getGroupById(id);

      // Check permissions
      const isSupervisor = group.supervisors.some((s) => s.userId === userId);
      const isLeader = group.leaderId === userId;
      const isClassTA = await groupService.isClassTAOrProfessor(id, userId);

      if (!isSupervisor && !isLeader && !isClassTA) {
        return res
          .status(403)
          .send(
            createBaseLayout(
              "Edit Group",
              "<p>You do not have permission to edit this group</p>"
            )
          );
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res
          .status(404)
          .send(createBaseLayout("Edit Group", "<p>Group not found</p>"));
      }
      throw error;
    }
  }

  // If creating new group, need classId
  if (!id && !classId) {
    return res
      .status(400)
      .send(createBaseLayout("Create Group", "<p>Class ID is required</p>"));
  }

  // Get class data with members for the form
  const targetClassId = classId || group?.classId;
  let classData = null;
  if (targetClassId) {
    const { prisma } = await import("../lib/prisma.js");
    classData = await prisma.class.findUnique({
      where: { id: targetClassId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // Merge class data into group object for template
  const groupWithClass = group
    ? { ...group, class: classData }
    : { class: classData };

  const content = renderGroupForm(
    groupWithClass,
    targetClassId,
    req.user,
    !!id
  );

  const isHtmxRequest = req.headers["hx-request"];
  if (isHtmxRequest) {
    res.send(content);
  } else {
    res.send(createBaseLayout(id ? "Edit Group" : "Create Group", content));
  }
});

/**
 * Handle group form submission (create or update)
 */
export const handleGroupForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isHtmxRequest = req.headers["hx-request"];

  if (id) {
    // Update existing group
    await updateGroup(req, res);
  } else {
    // Create new group
    await createGroup(req, res);
  }

  // If HTMX request, redirect to group detail page
  if (isHtmxRequest && res.statusCode < 400) {
    const groupId = id || res.locals.groupId;
    if (groupId) {
      return res.redirect(`/api/groups/${groupId}`);
    }
  }
});
