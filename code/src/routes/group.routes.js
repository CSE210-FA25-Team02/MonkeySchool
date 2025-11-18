import { Router } from "express";
import * as groupController from "../controllers/group.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

// HTML page routes for HTMX
router.get(
  "/my-groups",
  optionalAuth,
  asyncHandler(groupController.renderUserGroups)
);
router.get(
  "/new",
  optionalAuth,
  asyncHandler(groupController.renderGroupEditor)
);
router.get(
  "/:id/edit",
  optionalAuth,
  asyncHandler(groupController.renderGroupEditor)
);
router.get("/:id", optionalAuth, asyncHandler(groupController.renderGroup));

// JSON API routes
// Get groups for current user (Student view)
router.get(
  "/user/groups",
  requireAuth,
  asyncHandler(groupController.getUserGroups)
);

// Get all groups for a class (TA/Professor only)
router.get(
  "/class/:classId/groups",
  requireAuth,
  asyncHandler(groupController.getGroupsByClass)
);

// Get group members
router.get(
  "/:id/members",
  requireAuth,
  asyncHandler(groupController.getGroupMembers)
);

// Create group (TA only - checked in controller)
router.post("/", requireAuth, asyncHandler(groupController.createGroup));

// Update group (TA or Team Leader - checked in controller)
router.put("/:id", requireAuth, asyncHandler(groupController.updateGroup));

// Assign members to group (TA only - checked in controller)
router.post(
  "/:id/members",
  requireAuth,
  asyncHandler(groupController.assignMembers)
);

// Remove members from group (TA only - checked in controller)
router.delete(
  "/:id/members",
  requireAuth,
  asyncHandler(groupController.removeMembers)
);

// Delete group (TA only - checked in controller)
router.delete("/:id", requireAuth, asyncHandler(groupController.deleteGroup));

export default router;
