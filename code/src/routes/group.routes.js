/**
 * Group Routes
 *
 * Routes for group management operations.
 * All routes require authentication.
 *
 * code/src/routes/group.routes.js
 */

import { Router } from "express";
import * as groupController from "../controllers/group.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

// ============================================
// GROUP CRUD ROUTES
// ============================================

/**
 * Create a new group
 * POST /groups
 * Body: { name, classId, logoUrl?, mantra?, github?, members?, leaders?, supervisors? }
 */
router.post("/", requireAuth, asyncHandler(groupController.createGroup));

/**
 * Get group details
 * GET /groups/:groupId
 */
router.get(
  "/:groupId",
  requireAuth,
  asyncHandler(groupController.getGroupDetail)
);

/**
 * Update group details
 * PUT /groups/:groupId
 * Body: { name?, logoUrl?, mantra?, github? }
 */
router.put("/:groupId", requireAuth, asyncHandler(groupController.updateGroup));

/**
 * Delete a group
 * DELETE /groups/:groupId
 */
router.delete(
  "/:groupId",
  requireAuth,
  asyncHandler(groupController.deleteGroup)
);

// ============================================
// MEMBER MANAGEMENT ROUTES
// ============================================

/**
 * Add a member to a group
 * POST /groups/:groupId/members
 * Body: { userId, role? }
 */
router.post(
  "/:groupId/members",
  requireAuth,
  asyncHandler(groupController.addMember)
);

/**
 * Remove a member from a group
 * DELETE /groups/:groupId/members/:userId
 */
router.delete(
  "/:groupId/members/:userId",
  requireAuth,
  asyncHandler(groupController.removeMember)
);

/**
 * Update a member's role
 * PUT /groups/:groupId/members/:userId/role
 * Body: { role }
 */
router.put(
  "/:groupId/members/:userId/role",
  requireAuth,
  asyncHandler(groupController.updateMemberRole)
);

// ============================================
// SUPERVISOR MANAGEMENT ROUTES
// ============================================

/**
 * Add a supervisor to a group
 * POST /groups/:groupId/supervisors
 * Body: { userId }
 */
router.post(
  "/:groupId/supervisors",
  requireAuth,
  asyncHandler(groupController.addSupervisor)
);

/**
 * Remove a supervisor from a group
 * DELETE /groups/:groupId/supervisors/:userId
 */
router.delete(
  "/:groupId/supervisors/:userId",
  requireAuth,
  asyncHandler(groupController.removeSupervisor)
);

// ============================================
// UI MODAL ROUTES
// ============================================

/**
 * Get edit group modal
 * GET /groups/:groupId/edit-modal
 */
router.get(
  "/:groupId/edit-modal",
  requireAuth,
  asyncHandler(groupController.getEditGroupModal)
);

/**
 * Get delete confirmation modal
 * GET /groups/:groupId/delete-modal
 */
router.get(
  "/:groupId/delete-modal",
  requireAuth,
  asyncHandler(groupController.getDeleteGroupModal)
);

/**
 * Get group management modal (members/supervisors)
 * GET /groups/:groupId/manage
 */
router.get(
  "/:groupId/manage",
  requireAuth,
  asyncHandler(groupController.getGroupManagementModal)
);

export default router;
