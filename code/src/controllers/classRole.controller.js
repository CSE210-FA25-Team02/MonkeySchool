import * as classRoleService from "../services/classRole.service.js";
import * as classService from "../services/class.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { renderClassDirectory } from "../utils/htmx-templates/classes-templates.js";

/**
 * Add or update a user’s role inside a class
 */
export const assignRole = asyncHandler(async (req, res) => {
  const { userId, classId, role } = req.body;
  const result = await classRoleService.upsertClassRole({
    userId,
    classId,
    role,
  });
  res.json(result);
});

/**
 * Remove a user from a class
 */
export const removeRole = asyncHandler(async (req, res) => {
  const { userId, classId } = req.body;
  await classRoleService.removeFromClass({ userId, classId });
  res.status(204).send();
});

/**
 * Get roster for a class
 */
export const getRoster = asyncHandler(async (req, res) => {
  const roster = await classRoleService.getRoster(req.params.classId);
  res.json(roster);
});

// ============================================================================
// ROLE MANAGEMENT
// ============================================================================

/**
 * Change a member's role in a class (Professor only)
 * Route: PUT /classes/:classId/members/:userId/role
 * Auth: requireAuth + isProfessor
 */
export const changeMemberRole = asyncHandler(async (req, res) => {
  const { classId, userId } = req.params;
  const { role } = req.body;
  const currentUser = req.user;

  // Check if current user is a professor in this class
  const currentUserRole = await classRoleService.getClassRole(
    currentUser.id,
    classId,
  );
  if (!currentUserRole || currentUserRole.role !== "PROFESSOR") {
    return res.status(403).send("Only professors can change member roles.");
  }

  // Validate role
  const validRoles = ["STUDENT", "TUTOR", "TA", "PROFESSOR"];
  if (!validRoles.includes(role)) {
    return res.status(400).send("Invalid role specified.");
  }

  // Check if target user exists in class
  const targetUserRole = await classRoleService.getClassRole(userId, classId);
  if (!targetUserRole) {
    return res.status(404).send("User not found in this class.");
  }

  // Prevent last professor from demoting themselves
  if (
    userId === currentUser.id &&
    currentUserRole.role === "PROFESSOR" &&
    role !== "PROFESSOR"
  ) {
    // Count total professors in the class
    const allClassMembers = await classRoleService.getRoster(classId);
    const professorCount = allClassMembers.filter(
      (member) => member.role === "PROFESSOR",
    ).length;

    if (professorCount === 1) {
      return res
        .status(400)
        .send(
          "Cannot demote yourself - you are the only professor in this class. Assign another professor first.",
        );
    }
  }

  // Update the role
  await classRoleService.upsertClassRole({
    userId,
    classId,
    role,
  });

  // Get updated directory and return new content
  const directory = await classService.getClassDirectory(classId);
  const content = renderClassDirectory(
    directory || {
      professors: [],
      tas: [],
      tutors: [],
      groups: [],
      studentsWithoutGroup: [],
    },
    currentUser,
  );

  res.send(content);
});
